import md from "commonmark"
import mongodb from "mongodb"
let {MongoClient} = mongodb

let prepare = (strings, ...values) =>
{
	let unindented = strings.map(string => string.replace(/[\t\n]/g, ""))
	return (write, object) =>
	{
		write("<!doctype html>\n")
		
		let length = values.length
		for (let i = 0 ; i < length ; i++)
		{
			write(unindented[i])
			let value = object[values[i]]
			if (typeof value === "function")
				value()
			else
				write(value)
		}
		
		write(unindented[length])
		write("\n")
	}
}

let template = prepare`
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<title>${"title"} — zambonifofex’s stories</title>
			<meta name="viewport" content="width=device-width">
			<link rel="stylesheet" href="/style.css">
			<script type="module" src="/script.js"></script>
		</head>
		<body>
			<p tabindex="-1" id="display-options">layout configurations</p>
			<input type="checkbox" id="capitalization" class="option">
			<input type="radio" class="option" name="guidelines" id="guidelines-none" checked>
			<input type="radio" class="option" name="guidelines" id="guidelines-3">
			<input type="radio" class="option" name="guidelines" id="guidelines-4">
			<input type="radio" class="option" name="guidelines" id="guidelines-5">
			<input type="checkbox" class="option" id="typesetting" disabled>
			<input type="checkbox" class="option" id="typesetting-pull" disabled checked>
			<input type="checkbox" class="option" id="typesetting-hyphens" disabled checked>
			<div id="options">
				<p>
					<label for="capitalization" id="capitalization-label">enable capitalization</label>
				</p>
				<p>
					<label id="theme" class="disabled">
						theme:
						&#x20;
						<select disabled>
							<option value="milk">milk</option>
							<option value="" selected>caramel</option>
							<option value="cocoa">cocoa</option>
							<option value="coffee">coffee</option>
						</select>
					</label>
				</p>
				<p>
					guide rulers:
					&#x20;
					<span class="radio-group" id="guidelines-labels">
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
				${"main"}
				<footer>
					This story is licensed under <a href="https://creativecommons.org/licenses/by/4.0" rel="license">Creative Commons Attribution 4.0 International</a>.
				</footer>
			</main>
			<p id="list">
				<a href="/">list of stories</a>
			</p>
			<h2>feedback</h2>
			<form method="POST" action="/${"name"}/feedback">
				<p>
					<textarea name="message" required minlength="12"></textarea>
				</p>
				<p class="radio-group disabled">
					<label>
						<input type="radio" name="style" id="markdown" checked disabled>
						markdown
					</label>
					&#x20;
					<label>
						<input type="radio" name="style" id="prosemirror" disabled>
						prosemirror
					</label>
				</p>
				<p class="submit">
					<button>submit feedback</button>
				</p>
			</form>
			${"feedback"}
			<footer>this website makes use of <a href="/licenses.txt">various free software</a>.</footer>
		</body>
	</html>
`

let formatDate = date =>
{
	let result = ""
	let title = ""
	
	let add = (result_, title_ = result_) => { result += result_ ; title += title_ }
	
	switch (date.getUTCDay())
	{
		case 0: add("Sunday") ; break
		case 1: add("Monday") ; break
		case 2: add("Tuesday") ; break
		case 3: add("Wednesday") ; break
		case 4: add("Thursday") ; break
		case 5: add("Friday") ; break
		case 6: add("Saturday") ; break
	}
	
	add(", the ")
	
	let day = date.getUTCDate()
	
	switch (day)
	{
		case 1: add("first") ; break
		case 2: add("second") ; break
		case 3: add("third") ; break
		case 4: add("fourth") ; break
		case 5: add("fifth") ; break
		case 6: add("sixth") ; break
		case 7: add("seventh") ; break
		case 8: add("eighth") ; break
		case 9: add("ninth") ; break
		case 10: add("tenth") ; break
		case 11: add("eleventh") ; break
		case 12: add("twelfth") ; break
		case 13: add("thirteenth") ; break
		case 14: add("fourteenth") ; break
		case 15: add("fifteenth") ; break
		case 16: add("sixteenth") ; break
		case 17: add("seventeenth") ; break
		case 18: add("eighteenth") ; break
		case 19: add("nineteenth") ; break
		case 20: add("twentieth") ; break
		case 30: add("thirtieth") ; break
		default:
			add(day)
			switch (day % 10)
			{
				case 1: add("<sup>st</sup>", "st") ; break
				case 2: add("<sup>nd</sup>", "nd") ; break
				case 3: add("<sup>rd</sup>", "rd") ; break
				default: add("<sup>th</sup>", "th") ; break
			}
			break
	}
	
	add(" of ")
	
	switch (date.getUTCMonth() + 1)
	{
		case 1: add("January") ; break
		case 2: add("February") ; break
		case 3: add("March") ; break
		case 4: add("April") ; break
		case 5: add("May") ; break
		case 6: add("June") ; break
		case 7: add("July") ; break
		case 8: add("August") ; break
		case 9: add("September") ; break
		case 10: add("October") ; break
		case 11: add("November") ; break
		case 12: add("December") ; break
	}
	
	add(" of " + date.getUTCFullYear())
	
	title += " at "
	
	let hours = date.getUTCHours()
	title += hours.toString().padStart(2, "0") + ":"
	title += date.getUTCMinutes().toString().padStart(2, "0") + " "
	if (0 < hours && hours < 13) title += "a.m. (UTC)"
	else title += "UTC"
	
	return `<time datetime="${date.toISOString()}" title="${title}">${result}</time>`
}

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

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
	
	return {title: title.toLowerCase(), main: renderer.render(tree)}
}

let mongo

export default async ({query: {name}}, res) =>
{
	if (!mongo || !mongo.isConnected())
		mongo = await MongoClient.connect(process.env.mongo_url)
	
	let stories = mongo.db(process.env.mongo_database).collection("stories")
	let story = await stories.findOne({name})
	
	if (!story)
	{
		let other = await stories.findOne({aliases: name}, {name: true})
		if (other)
		{
			res.statusCode = 307
			res.setHeader("location", `/${other.name}`)
			res.end()
		}
		else
		{
			res.statusCode = 404
			res.end()
		}
		return
	}
	
	let page = processStory(story.text)
	
	res.setHeader("content-type", "text/html")
	
	let feedback = async () =>
	{
		for (let {message, response, date} of story.feedback)
		{
			res.write(`<article><header><p>On `)
			res.write(formatDate(date))
			res.write(`, someone said:</p></header>`)
			
			res.write(processFeedback(message))
			
			res.write(`</article>`)
			
			if (response)
			{
				res.write(`<article class="response"><header><p>Response from the author:</p></header>`)
				res.write(processFeedback(response))
				res.write(`</article>`)
			}
		}
	}
	
	await template(s => res.write(s), {...page, name, feedback})
	
	res.end()
}
