import buildFeed from "./feed.js"
import {toAtom, micromark, createHash} from "./dependencies.js"

let months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

let decoder = new TextDecoder()
let encoder = new TextEncoder()

let unindent = string => string.replace(/[\t\n]+/g, "").replace(/&#x20;/g, " ")

let computeHash = buffer =>
{
	let hash = createHash("sha256")
	hash.update(buffer)
	return hash.toString()
}

let essentials = ["/style.css", "/script.js", "/dependencies.css", "/dependencies.js"]

let computeHashes = async (path, hashes) =>
{
	for await (let entry of Deno.readDir("public" + path))
	{
		if (entry.isDirectory)
		{
			await computeHashes(path + entry.name + "/", hashes)
		}
		else
		{
			let name = path
			let hash = computeHash(await Deno.readFile("public" + path + entry.name))
			if (entry.name !== "index.html") name += entry.name
			let essential = name.startsWith("/scripts/") || essentials.includes(name) || undefined
			hashes[name] = {hash, essential}
		}
	}
}

let hashes = {}
await computeHashes("/", hashes)

let pageBuffer = await Deno.readFile("pages/story.html")
let indexBuffer = await Deno.readFile("pages/list.html")

let page = unindent(decoder.decode(pageBuffer))
let index = unindent(decoder.decode(indexBuffer))

let list = []

let items = []

let robots = "user-agent: *\n"
robots += "disallow: /\n"
robots += "allow: /$\n"

let origin = Deno.env.get("neocities_origin")
let token = Deno.env.get("neocities_token")

let api = Deno.env.get("vercel_origin")

let response = await fetch("https://neocities.org/api/list?path=stories", {headers: {authorization: `Bearer ${token}`}})
let {files} = await response.json()

for (let {path} of files)
{
	let name = path.slice("stories/".length)
	
	let [title, description, publication] = (await (await fetch(new URL(`stories/${name}/meta.txt`, origin))).text()).split(/\n/g)
	let text = await (await fetch(new URL(`stories/${name}/story.md`, origin))).text()
	
	let main = micromark(text)
	
	let values =
	{
		main,
		title,
		name,
		description,
		origin,
		api,
	}
	
	let buffer = encoder.encode(page.replace(/\(\((.+?)\)\)/g, (full, name) => values[name]))
	
	await Deno.mkdir(`public/${name}`, {recursive: true})
	await Deno.writeFile(`public/${name}/index.html`, buffer)
	
	hashes[`/${name}/`] = {hash: computeHash(buffer)}
	
	let [year, month] = publication.split("-")
	list.push(
	[
		publication,
		`<a href="/${name}/"><article>` +
		`<h2>${title}</h2>` +
		`<p><time datetime="${publication}">${months[month - 1]} ${year}</time></p>` +
		`<p>${description}</p>` +
		`</article></a>`,
	])
	
	// Publication dates have only year and month information, but JSON feed requires full date and time, so I just set it to 16:00 of the tenth day of the month.
	items.push({title, description, publication: `${publication}-10T16:00:00-03:00`, url: new URL(`/${name}/`, origin).href})
	
	robots += `allow: /${name}/$\n`
}

list.sort(([a], [b]) => a > b ? -1 : a < b ? 1 : 0)

let buffer = encoder.encode(index.replace("((origin))", origin).replace("((list))", list.reduce(([pa, a], [pb, b]) => a + b)))
await Deno.writeFile("public/index.html", buffer)

hashes["/"] = {hash: computeHash(buffer), essential: true}

let feedJSON = await buildFeed(items)
let feed = JSON.parse(feedJSON)
await Deno.writeFile("public/feed.json", encoder.encode(feedJSON))
await Deno.writeFile("public/atom.xml", encoder.encode(toAtom(feed, {feedURLFn: () => new URL(`/atom.xml`, origin).href})))

await Deno.writeFile("public/robots.txt", encoder.encode(robots))

await Deno.writeFile(`public/hashes.json`, encoder.encode(JSON.stringify(hashes)))
