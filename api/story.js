import pages from "./pages.json"
import {Storage} from "@google-cloud/storage"
import md from "commonmark"
import process from "process"

let formatDate = date =>
{
	let result = ""
	
	switch (date.getUTCDay())
	{
		case 0: result += "Sunday" ; break
		case 1: result += "Monday" ; break
		case 2: result += "Tuesday" ; break
		case 3: result += "Wednesday" ; break
		case 4: result += "Thursday" ; break
		case 5: result += "Friday" ; break
		case 6: result += "Saturday" ; break
	}
	
	result += ", "
	
	switch (date.getUTCMonth() + 1)
	{
		case 1: result += "January" ; break
		case 2: result += "February" ; break
		case 3: result += "March" ; break
		case 4: result += "April" ; break
		case 5: result += "May" ; break
		case 6: result += "June" ; break
		case 7: result += "July" ; break
		case 8: result += "August" ; break
		case 9: result += "September" ; break
		case 10: result += "October" ; break
		case 11: result += "November" ; break
		case 12: result += "December" ; break
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
	rest += date.getUTCSeconds().toString().padStart(2, "0") + " UTC"
	
	if (full)
	{
		return (
			`<time datetime="${date.toISOString()}" title="${text + rest}">` +
			`${day} ${ordenal} ${year}</time>`
		)
	}
	else
	{
		return (
			`<time datetime="${date.toISOString()}" title="${result} ${day + ordenal} ${year + rest}">` +
			`${result} ${day}<sup>${ordenal}</sup> ${year}</time>`
		)
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
	
	let cached = cache[name]
	if (cached) return cached
	
	let tree = parser.parse((await file.download())[0].toString("utf-8"))
	
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
	
	let rendered = renderer.render(tree)
	cache[name] = rendered
	return rendered
}

export default async ({query: {name}}, res) =>
{
	let page = pages[name]
	
	if (!page)
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
	
	res.setHeader("content-type", "text/html")
	
	res.write(page[0])
	
	for (let {file, time} of feedback)
	{
		res.write(`<article><header><p>On `)
		
		let date = new Date(time)
		
		res.write(formatDate(date))
		
		res.write(`, someone said:</p></header>`)
		
		res.write(await download(file))
		
		res.write(`</article>`)
		
		let response = responses[time]
		if (response)
		{
			res.write(`<article class="response"><header><p>Response from the author:</p></header>`)
			res.write(await download(response))
			res.write(`</article>`)
		}
	}
	
	res.end(page[1])
}
