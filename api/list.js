import mongodb from "mongodb"
let {MongoClient} = mongodb

let unindent = (strings, ...values) =>
	strings.map((string, i) => (i ? values[i - 1] : "") + string.replace(/[\t\n]/g, "")).join("")

let months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

let html
let time = 0

export default async (req, res) =>
{
	let now = Date.now()
	if (now - time < 300000)
	{
		res.end(html)
		return
	}
	
	let mongo = await MongoClient.connect(process.env.mongo_url, {useUnifiedTopology: true})
	let stories = mongo.db(process.env.mongo_database).collection("stories").find({publication: {$ne: null}}, {name: true, title: true, publication: true}).sort({publication: -1})
	
	let list = ""
	
	for await (let {name, title, publication} of stories)
	{
		let [year, month] = publication.split("-")
		list += `<li><a href="/${name.replace(/"/g, "&quot;")}">`
		list += title.replace(/</g, "&lt;") + "</a> — "
		list += months[month - 1] + " " + year
		list += `</li>`
	}
	await mongo.close()
	
	time = now
	
	html = `<!doctype html>\n` +
		`<html lang="en"><head>` +
		`<meta charset="utf-8">` +
		`<title>zambonifofex’s stories</title>` +
		`<meta name="viewport" content="width=device-width">` +
		`<link rel="stylesheet" href="/style.css">` +
		`</head><body><h1>zambonifofex’s stories</h1>` +
		`<ul>` + list + `</ul>` +
		`<p><small>this website’s infrastucture is free software ` +
		`<a href="https://github.com/Zambonifofex/stories" title="this website’s repository on github">available on github</a>. ` +
		`contributions and issue reports are welcome!</small></p></body></html>\n`
	
	res.end(html)
}
