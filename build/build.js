import md from "commonmark"
import mongodb from "mongodb"
import fs from "fs"
import formatDate, {months} from "../dates.js"
import buildFeedback from "./feedback.js"
import https from "https"
import util from "util"

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
	
	for await (let {aliases = [], title, description = "", text, feedback: feedbackMessages = [], name, publication} of stories.find().sort({publication: -1}))
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
		list += `<li><a href="/${name}">${title}</a> — `
		list += `${months[month - 1].toLowerCase()} ${year}</li>`
	}
	
	await fsp.writeFile(`public/index.html`, index.replace("((list))", list))
	
	await mongo.close()
}

main()
