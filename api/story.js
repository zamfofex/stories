import jsdom from "jsdom"
import pages from "./pages.json"
import {Storage} from "@google-cloud/storage"
import md from "commonmark"
import process from "process"

let {JSDOM} = jsdom

let formatDate = ({date, document, node}) =>
{
	node.dateTime = date.toISOString()
	
	let result = ""
	
	switch (date.getUTCDay())
	{
		case 0: result += "sunday" ; break
		case 1: result += "monday" ; break
		case 2: result += "tuesday" ; break
		case 3: result += "wednesday" ; break
		case 4: result += "thursday" ; break
		case 5: result += "friday" ; break
		case 6: result += "saturday" ; break
	}
	
	result += ", "
	
	switch (date.getUTCMonth())
	{
		case 0: result += "january" ; break
		case 1: result += "february" ; break
		case 2: result += "march" ; break
		case 3: result += "april" ; break
		case 4: result += "may" ; break
		case 5: result += "june" ; break
		case 6: result += "july" ; break
		case 7: result += "august" ; break
		case 8: result += "september" ; break
		case 9: result += "october" ; break
		case 10: result += "november" ; break
		case 11: result += "december" ; break
	}
	
	let day = date.getUTCDate()
	
	let ordenal
	let full = true
	
	switch (day)
	{
		case 1: ordenal = "first" ; break
		case 2: ordenal = "second" ; break
		case 3: ordenal = "third" ; break
		case 4: ordenal = "fourth" ; break
		case 5: ordenal = "fifth" ; break
		case 6: ordenal = "sixth" ; break
		case 7: ordenal = "seventh" ; break
		case 8: ordenal = "eighth" ; break
		case 9: ordenal = "ninth" ; break
		case 10: ordenal = "tenth" ; break
		case 11: ordenal = "eleventh" ; break
		case 12: ordenal = "twelfth" ; break
		case 13: ordenal = "thirteenth" ; break
		case 14: ordenal = "fourteenth" ; break
		case 15: ordenal = "fifteenth" ; break
		case 16: ordenal = "sixteenth" ; break
		case 17: ordenal = "seventeenth" ; break
		case 18: ordenal = "eighteenth" ; break
		case 19: ordenal = "nineteenth" ; break
		case 20: ordenal = "twentieth" ; break
		case 30: ordenal = "thirtieth" ; break
		default:
			full = false
			switch (day % 10)
			{
				case 1: ordenal = "st" ; break
				case 2: ordenal = "nd" ; break
				case 3: ordenal = "rd" ; break
				default: ordenal = "th"
			}
	}
	
	let year = date.getUTCFullYear()
	
	let rest = " at "
	
	rest += date.getUTCHours().toString().padStart(2, "0") + ":"
	rest += date.getUTCMinutes().toString().padStart(2, "0") + ":"
	rest += date.getUTCSeconds().toString().padStart(2, "0") + " utc"
	
	if (full)
	{
		let text = day + " " + ordenal + " " + year
		node.append(text)
		node.title = text + rest
	}
	else
	{
		let sup = document.createElement("sup")
		sup.append(ordenal)
		node.append(result, " ", day, sup, " ", year)
		
		node.title = result + " " + day + ordenal + " " + year + rest
	}
}

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

let storage = new Storage({credentials: JSON.parse(process.env.google_credentials_json)})

let bucket = storage.bucket(process.env.bucket_name)

let feedbackRegex = /^([1-9][0-9]*)\.md*$/
let responsesRegex = /^([1-9][0-9]*)\/reply\.md$/

let cache = {}

let download = async file =>
{
	let name = file.metadata.name
	return cache[name] || (cache[name] = (await file.download())[0])
}

export default async ({query: {name}}, res) =>
{
	if (!(name in pages))
	{
		res.statusCode = 404
		res.end()
		return
	}
	
	let length = name.length + 2
	
	let feedback = []
	
	let responses = {}
	
	for (let file of (await bucket.getFiles({prefix: `/${name}/`}))[0])
	{
		let filename = file.metadata.name.slice(length)
		
		let match
		if (match = filename.match(feedbackRegex))
		{
			feedback.push({file, time: Number(match[1])})
		}
		else if (match = filename.match(responsesRegex))
		{
			responses[match[1]] = file
		}
	}
	
	feedback.sort(({time: a}, {time: b}) => a - b)
	
	let dom = new JSDOM(pages[name])
	let {window: {document}} = dom
	
	for (let {file, time} of feedback)
	{
		let date = new Date(time)
		
		let article = document.createElement("article")
		
		let header = document.createElement("header")
		
		let t = document.createElement("time")
		formatDate({date, document, node: t})
		
		let p = document.createElement("p")
		p.append("on ", t, ", someone said:")
		
		header.append(p)
		
		let tree = parser.parse((await download(file)).toString("utf-8"))
		
		let walker = tree.walker()
		while (true)
		{
			let event = walker.next()
			if (!event) break
			let {entering, node} = event
			if (entering) continue
			if (node.type !== "heading") continue
			if (node.level > 4) node.level = 6
			else node.level += 2
		}
		
		article.append(header, JSDOM.fragment(renderer.render(tree)))
		
		document.body.append(article)
		
		let response = responses[time]
		if (response)
		{
			let article = document.createElement("article")
			article.classList.add("response")
			let header = document.createElement("header")
			let p = document.createElement("p")
			p.append("response from the author:")
			header.append(p)
			article.append(header, JSDOM.fragment(renderer.render(parser.parse((await download(response)).toString("utf-8")))))
			document.body.append(article)
		}
	}
	
	res.setHeader("content-type", "text/html");
	res.end(dom.serialize())
}
