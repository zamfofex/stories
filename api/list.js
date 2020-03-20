import md from "commonmark"
import mongodb from "mongodb"
let {MongoClient} = mongodb

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

let unindent = (strings, ...values) =>
	strings.map((string, i) => (i ? values[i - 1] : "") + string.replace(/[\t\n]/g, "")).join("")

let html
let time = 0

export default async (req, res) =>
{
	if (Date.now() - time > 300000)
	{
		let mongo = await MongoClient.connect(process.env.mongo_url)
		
		let page = await mongo.db(process.env.mongo_database).collection("pages").findOne({name: "list"})
		
		await mongo.close()
		html =
			"<!doctype html>\n" +
			unindent`
				<html lang="en">
					<head>
						<meta charset="utf-8">
						<title>zambonifofex’s stories</title>
						<meta name="viewport" content="width=device-width">
						<link rel="stylesheet" href="/style.css">
					</head>
					<body>
						${renderer.render(parser.parse(page.content))}
					</body>
				</html>
			` + "\n"
	}
	
	res.end(html)
}
