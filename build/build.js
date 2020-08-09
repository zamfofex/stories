import md from "commonmark"
import mongodb from "mongodb"
import fs from "fs"
import {months} from "../dates.js"
import buildFeedback from "./feedback.js"
import buildFeed from "./feed.js"
import toRSS from "jsonfeed-to-rss"
import toAtom from "jsonfeed-to-atom"

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

let {MongoClient} = mongodb

let fsp = fs.promises

let unindent = string => string.replace(/[\t\n]+/g, "").replace(/&#x20;/g, " ")

let main = async () =>
{
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
		
		let values =
		{
			main,
			title,
			name,
			feedback,
			description,
		}
		
		await fsp.mkdir(`public/${name}`, {recursive: true})
		await fsp.writeFile(`public/${name}/index.html`, page.replace(/\(\((.+?)\)\)/g, (full, name) => values[name]))
		
		if (!publication) continue
		
		let [year, month] = publication.split("-")
		list += `<li><a href="/${name}/">${title}</a> — `
		list += `${months[month - 1].toLowerCase()} ${year}</li>`
		
		// Publication dates have only year and month information, but JSON feed requires full date and time, so I just set it to 16:00 of the tenth day of the month.
		items.push({title, description, text, main, publication: `${publication}-10T16:00:00-03:00`, url: `https://zamstories.neocities.org/${name}/`})
		
		robots += `allow: /${name}/$\n`
	}
	
	await fsp.writeFile("public/index.html", index.replace("((list))", list))
	
	let feedJSON = await buildFeed(items)
	let feed = JSON.parse(feedJSON)
	await fsp.writeFile("public/feed.json", feedJSON)
	await fsp.writeFile("public/rss.xml", toRSS(feed, {feedURLFn: () => "https://zamstories.neocities.org/rss.xml", copyright: "© 2019–2020 Zambonifofex"}))
	await fsp.writeFile("public/atom.xml", toAtom(feed, {feedURLFn: () => "https://zamstories.neocities.org/atom.xml"}))
	
	await fsp.writeFile("public/robots.txt", robots)
	
	await mongo.close()
}

main()
