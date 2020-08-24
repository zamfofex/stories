import md from "commonmark"
import mongodb from "mongodb"
import fs from "fs"
import {months} from "../dates.js"
import buildFeedback from "./feedback.js"
import buildFeed from "./feed.js"
import toRSS from "jsonfeed-to-rss"
import toAtom from "jsonfeed-to-atom"
import crypto from "crypto"

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

let {MongoClient} = mongodb

let fsp = fs.promises

let unindent = string => string.replace(/[\t\n]+/g, "").replace(/&#x20;/g, " ")

let computeHash = buffer => crypto.createHash("sha256").update(buffer).digest("hex")

let essentials = ["/style.css", "/script.js", "/dependencies.css"]

let computeHashes = async (path, hashes) =>
{
	for (let entry of await fsp.readdir("public" + path, {withFileTypes: true}))
	{
		if (entry.isDirectory())
		{
			await computeHashes(path + entry.name + "/", hashes)
		}
		else
		{
			let name = path
			let hash = computeHash(await fsp.readFile("public" + path + entry.name))
			if (entry.name !== "index.html") name += entry.name
			let essential = name.startsWith("/scripts/") || essentials.includes(name) || undefined
			hashes[name] = {hash, essential}
		}
	}
}

let main = async () =>
{
	let hashes = {}
	await computeHashes("/", hashes)
	
	let page = unindent(await fsp.readFile("build/story.html", "utf-8"))
	let index = unindent(await fsp.readFile("build/list.html", "utf-8"))
	
	let mongo = await MongoClient.connect(process.env.mongo_url, {useUnifiedTopology: true})
	
	let stories = mongo.db(process.env.mongo_database).collection("stories")
	
	let list = ""
	
	let items = []
	
	let robots = "user-agent: *\n"
	robots += "disallow: /\n"
	robots += "allow: /$\n"
	
	for await (let {title, description = "", text, feedback: feedbackMessages = [], name, publication} of stories.find().sort({publication: -1}))
	{
		let main = renderer.render(parser.parse(text))
		
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
		
		let buffer = Buffer.from(page.replace(/\(\((.+?)\)\)/g, (full, name) => values[name]))
		
		await fsp.mkdir(`public/${name}`, {recursive: true})
		await fsp.writeFile(`public/${name}/index.html`, buffer)
		
		if (!publication) continue
		
		hashes[`/${name}/`] = {hash: computeHash(buffer)}
		
		let [year, month] = publication.split("-")
		list += `<li><a href="/${name}/"><span>${title}</span> <span>— <time datetime="${publication}">`
		list += `${months[month - 1].toLowerCase()} ${year}</time></a></li></span>`
		
		// Publication dates have only year and month information, but JSON feed requires full date and time, so I just set it to 16:00 of the tenth day of the month.
		items.push({title, description, text, main, publication: `${publication}-10T16:00:00-03:00`, url: `https://zamstories.neocities.org/${name}/`})
		
		robots += `allow: /${name}/$\n`
	}
	
	let buffer = Buffer.from(index.replace("((list))", list))
	await fsp.writeFile("public/index.html", buffer)
	
	hashes["/"] = {hash: computeHash(buffer), essential: true}
	
	let feedJSON = await buildFeed(items)
	let feed = JSON.parse(feedJSON)
	await fsp.writeFile("public/feed.json", feedJSON)
	await fsp.writeFile("public/rss.xml", toRSS(feed, {feedURLFn: () => "https://zamstories.neocities.org/rss.xml", copyright: "© 2019–2020 Zamfofex"}))
	await fsp.writeFile("public/atom.xml", toAtom(feed, {feedURLFn: () => "https://zamstories.neocities.org/atom.xml"}))
	
	await fsp.writeFile("public/robots.txt", robots)
	
	await fsp.writeFile(`public/hashes.json`, JSON.stringify(hashes))
	
	await mongo.close()
}

main()
