import md from "commonmark"
import download from "./_download.js"
import bucket from "./_bucket.js"

let unindent = write => async (strings, ...values) =>
{
	let i = 0
	for (let string of strings)
	{
		write(string.replace(/[\t\n]/g, ""))
		let value = await values[i]
		if (typeof value === "function")
			await value()
		else
			write(value || "")
		i++
	}
}

let template = async (write, {title, main, name, feedback}) =>
{
	write("<!doctype html>\n")
	await unindent(write)`
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<title>${title} — zambonifofex’s stories</title>
				<meta name="viewport" content="width=device-width">
				<link rel="stylesheet" href="/style.css">
				<script type="module" src="/script.js"></script>
			</head>
			<body>
				<input type="checkbox" id="capitalization" class="option">
				<input type="radio" class="option" name="guidelines" id="guidelines-none" checked>
				<input type="radio" class="option" name="guidelines" id="guidelines-3">
				<input type="radio" class="option" name="guidelines" id="guidelines-4">
				<input type="radio" class="option" name="guidelines" id="guidelines-5">
				<input type="checkbox" class="option" id="typesetting" disabled>
				<input type="checkbox" class="option" id="typesetting-pull" disabled checked>
				<input type="checkbox" class="option" id="typesetting-hyphens" disabled checked>
				<p tabindex="-1" id="display-options">layout configurations</p>
				<div id="options">
					<p>
						<label for="capitalization" id="capitalization-label">enable capitalization</label>
					</p>
					<p>
						guidelines:
						&#x20;
						<span class="radio-buttons" id="guidelines-labels">
							<label for="guidelines-none" id="guidelines-none-label">disabled</label>
							&#x20;
							<label for="guidelines-3" id="guidelines-3-label">3</label>
							&#x20;
							<label for="guidelines-4" id="guidelines-4-label">4</label>
							&#x20;
							<label for="guidelines-5" id="guidelines-5-label">5</label>
						</span>
					</p>
					<p>
						<label for="typesetting" id="typesetting-label">custom typesetting</label>
					</p>
					<p>
						<label for="typesetting-pull" id="typesetting-pull-label">optical alignment</label>
					</p>
					<p>
						<label for="typesetting-hyphens" id="typesetting-hyphens-label">hyphenation</label>
					</p>
				</div>
				<main>
					${main}
					<footer>
						This story is licensed under <a href="https://creativecommons.org/licenses/by/4.0" rel="license">Creative Commons Attribution 4.0 International</a>.
					</footer>
				</main>
				<p id="list">
					<a href="/">list of stories</a>
				</p>
				<h2>feedback</h2>
				<form method="POST" action="/${name}/feedback">
					<p>
						<textarea name="message" required="" minlength="12"></textarea>
					</p>
					<p class="submit">
						<button>submit feedback</button>
					</p>
				</form>
				${feedback}
				<footer>this website makes use of <a href="/licenses.txt">various free software</a>.</footer>
			</body>
		</html>
	`
	write("\n")
}

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
				default: ordenal = "th" ; break
			}
			break
	}
	
	let year = date.getUTCFullYear()
	
	let rest = " at "
	
	rest += date.getUTCHours().toString().padStart(2, "0") + ":"
	rest += date.getUTCMinutes().toString().padStart(2, "0") + ":"
	rest += date.getUTCSeconds().toString().padStart(2, "0") + " UTC"
	
	if (full)
	{
		return (
			`<time datetime="${date.toISOString()}" title="${result} ${ordenal} ${year + rest}">` +
			`${result} ${ordenal} ${year}</time>`
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
let unsafeRenderer = new md.HtmlRenderer()

let feedbackRegex = /^([1-9][0-9]*)\.md*$/
let responsesRegex = /^([1-9][0-9]*)\/reply\.md$/

let processFeedback = md =>
{
	let tree = parser.parse(md)
	
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
	
	return renderer.render(tree)
}

let processStory = md =>
{
	let title = "unknown"
	let tree = parser.parse(md)
	
	let walker = tree.walker()
	while (true)
	{
		let event = walker.next()
		if (!event) break
		let {entering, node} = event
		if (entering) continue
		if (node.type !== "heading") continue
		if (node.level !== 1) continue
		
		title = ""
		let hWalker = node.walker()
		while (true)
		{
			let event = hWalker.next()
			if (!event) break
			let {node} = event
			if (node.type !== "text") continue
			
			title += node.literal
			break
		}
		break
	}
	
	return {title: title.toLowerCase(), main: unsafeRenderer.render(tree)}
}

export default async ({query: {name}}, res) =>
{
	let page = await download(bucket.file(`/${name}.md`), processStory, `/${name}.md`)
	
	if (!page)
	{
		res.statusCode = 404
		res.end()
		return
	}
	
	let length = name.length + 2
	
	let messages = []
	
	let responses = {}
	
	for (let file of (await bucket.getFiles({prefix: `/${name}/`}))[0])
	{
		let filename = file.metadata.name.slice(length)
		
		let match
		
		if (match = filename.match(feedbackRegex))
			messages.push({file, time: Number(match[1])})
		else if (match = filename.match(responsesRegex))
			responses[match[1]] = file
	}
	
	messages.sort(({time: a}, {time: b}) => a - b)
	
	res.setHeader("content-type", "text/html")
	
	let feedback = async () =>
	{
		for (let {file, time} of messages)
		{
			res.write(`<article><header><p>On `)
			
			let date = new Date(time)
			
			res.write(formatDate(date))
			
			res.write(`, someone said:</p></header>`)
			
			res.write(await download(file, processFeedback))
			
			res.write(`</article>`)
			
			let response = responses[time]
			if (response)
			{
				res.write(`<article class="response"><header><p>Response from the author:</p></header>`)
				res.write(await download(response, processFeedback))
				res.write(`</article>`)
			}
		}
	}
	
	await template(s => res.write(s), {...page, name, feedback})
	
	res.end()
}
