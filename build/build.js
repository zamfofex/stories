import {months} from "./dates.js"
import buildFeedback from "./feedback.js"
import buildFeed from "./feed.js"
import {MongoClient, toAtom, micromark, createHash} from "./dependencies.js"

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

let mongo = new MongoClient()
mongo.connectWithUri(Deno.env.get("mongo_url"))

let stories = mongo.database(Deno.env.get("mongo_database")).collection("stories")

let list = ""

let items = []

let robots = "user-agent: *\n"
robots += "disallow: /\n"
robots += "allow: /$\n"

for (let {title, description = "", text, feedback: feedbackMessages = [], name, publication} of (await stories.find()).sort(({publication: a}, {publication: b}) => a < b ? 1 : a > b ? -1 : 0))
{
	let main = micromark(text)
	
	let feedback = buildFeedback(feedbackMessages)
	
	let end = publication ? "the end" : "to be continued…"
	
	let values =
	{
		main,
		title,
		name,
		feedback,
		description,
		end,
	}
	
	let buffer = encoder.encode(page.replace(/\(\((.+?)\)\)/g, (full, name) => values[name]))
	
	await Deno.mkdir(`public/${name}`, {recursive: true})
	await Deno.writeFile(`public/${name}/index.html`, buffer)
	
	if (!publication) continue
	
	hashes[`/${name}/`] = {hash: computeHash(buffer)}
	
	let [year, month] = publication.split("-")
	list += `<a href="/${name}/"><article>`
	list += `<h2>${title}</h2>`
	list += `<p><time datetime="${publication}">${months[month - 1].toLowerCase()} ${year}</time></p>`
	list += `<p>${description}</p>`
	list += `</article></a>`
	
	// Publication dates have only year and month information, but JSON feed requires full date and time, so I just set it to 16:00 of the tenth day of the month.
	items.push({title, description, publication: `${publication}-10T16:00:00-03:00`, url: `https://zamstories.neocities.org/${name}/`})
	
	robots += `allow: /${name}/$\n`
}

let buffer = encoder.encode(index.replace("((list))", list))
await Deno.writeFile("public/index.html", buffer)

hashes["/"] = {hash: computeHash(buffer), essential: true}

let feedJSON = await buildFeed(items)
let feed = JSON.parse(feedJSON)
await Deno.writeFile("public/feed.json", encoder.encode(feedJSON))
await Deno.writeFile("public/atom.xml", encoder.encode(toAtom(feed, {feedURLFn: () => "https://zamstories.neocities.org/atom.xml"})))

await Deno.writeFile("public/robots.txt", encoder.encode(robots))

await Deno.writeFile(`public/hashes.json`, encoder.encode(JSON.stringify(hashes)))

mongo.close()
