import md from "commonmark"
import mongodb from "mongodb"
import fs from "fs"

let {MongoClient} = mongodb

let fsp = fs.promises

let prepare = (strings, ...values) =>
{
	let unindented = strings.map(string => string.replace(/[\t\n]+/g, "").replace(/&#x20;/g, " "))
	return (write, object) =>
	{
		write("<!doctype html>\n")
		
		let length = values.length
		for (let i = 0 ; i < length ; i++)
		{
			write(unindented[i])
			write(values[i](object))
		}
		
		write(unindented[length])
		write("\n")
	}
}

let g = key => object => String(object[key])
let input = (attributes, key, value = "on") => object => `<input ${attributes}${object[key] === value ? " checked" : ""}>`
let check = (string, key, value = "on") => object => object[key] === value ? string : ""
let cl = name => check(" "+ name, name)

let template = prepare`
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<title>${g("title")} — zambonifofex’s stories</title>
			<meta name="viewport" content="width=device-width">
			<link rel="stylesheet" href="/style.css">
			<script type="module" src="/script.js"></script>
		</head>
		<body class="${cl("capitalization")}${cl("typesetting")}${cl("optical-alignment")}${cl("semantic-spacing")}" data-guide-rulers="${g("guide-rulers")}" data-theme="${g("theme")}">
			<p tabindex="0" id="display-settings">layout settings</p>
			<form id="settings" method="POST" action="/settings">
				<p>
					<label>
						${input(`type="checkbox" name="capitalization"`, "capitalization")} enable capitalization
					</label>
				</p>
				<p>
					guide rulers:
					&#x20;
					<span class="radio-group">
						<label>
							${input(`type="radio" name="guide-rulers" value="none"`, "guide-rulers", "none")} disabled
						</label>
						<label>
							${input(`type="radio" name="guide-rulers" value="3"`, "guide-rulers", "3")} 3
						</label>
						<label>
							${input(`type="radio" name="guide-rulers" value="4"`, "guide-rulers", "4")} 4
						</label>
						<label>
							${input(`type="radio" name="guide-rulers" value="5"`, "guide-rulers", "5")} 5
						</label>
					</span>
				</p>
				<p>
					<label class="disabled">
						${input(`type="checkbox" name="typesetting" disabled`, "typesetting")}
						&#x20;
						custom typesetting
					</label>
				</p>
				<p>
					<label class="disabled">
						${input(`type="checkbox" name="optical-alignment" disabled`, "optical-alignment")}
						&#x20;
						optical alignment
					</label>
				</p>
				<p>
					<label class="disabled">
						${input(`type="checkbox" name="hyphenation" disabled`, "hyphenation")}
						&#x20;
						hyphenation
					</label>
				</p>
				<p>
					<label class="disabled">
						${input(`type="checkbox" name="semantic-spacing" disabled`, "semantic-spacing")}
						&#x20;
						semantic spacing
					</label>
					&#x20;
					— <a href="https://github.com/Zambonifofex/stories/issues/10">beta</a>
				</p>
				<p>
					<label>
						theme:
						&#x20;
						<select name="theme">
							<option value="milk"${check(" selected", "theme", "milk")}>milk</option>
							<option value="caramel"${check(" selected", "theme", "caramel")}>caramel</option>
							<option value="cocoa"${check(" selected", "theme", "cocoa")}>cocoa</option>
							<option value="coffee"${check(" selected", "theme", "coffee")}>coffee</option>
						</select>
					</label>
				</p>
				<p class="submit">
					<input type="hidden" name="name" value="${g("name")}">
					<button>apply settings</button>
				</p>
				<p class="submit"><small>note: settings use cookies</small></p>
			</form>
			<main>
				${g("main")}
				<footer>
					This story is licensed under <a href="https://creativecommons.org/licenses/by/4.0" rel="license">Creative Commons Attribution 4.0 International</a>.
				</footer>
			</main>
			<p id="list">
				<a href="/">list of stories</a>
			</p>
			<h2>feedback</h2>
			<form method="POST" action="/${g("name")}/feedback">
				<p>
					<textarea name="message" required minlength="12"></textarea>
				</p>
				<p class="radio-group disabled">
					<label>
						<input type="radio" name="mode" id="markdown" checked disabled>
						markdown
					</label>
					&#x20;
					<label>
						<input type="radio" name="mode" id="easy-mde" disabled>
						easy mde
					</label>
				</p>
				<p class="submit">
					<button>submit feedback</button>
				</p>
			</form>
			${g("feedback")}
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

let mongo
let notFoundPage

export default async ({query: {name}, cookies}, res) =>
{
	if (!mongo || !mongo.isConnected())
		mongo = await MongoClient.connect(process.env.mongo_url, {useUnifiedTopology: true})
	
	if (!notFoundPage)
		notFoundPage = prepare([await fsp.readFile("not-found/main.html", "utf-8")])
	
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
			notFoundPage(s => res.write(s))
			res.end()
		}
		return
	}
	
	let main = renderer.render(parser.parse(story.text))
	let {title} = story
	
	res.setHeader("content-type", "text/html")
	
	let feedback = ""
	
	for (let {message, response, date} of story.feedback || [])
	{
		feedback += `<article><header><p>on `
		feedback += formatDate(date)
		feedback += `, someone said:</p></header>`
		
		feedback += processFeedback(message)
		
		feedback += `</article>`
		
		if (response)
		{
			feedback += `<article class="response"><header><p>response from the author:</p></header>`
			feedback += processFeedback(response)
			feedback += `</article>`
		}
	}
	
	let
	{
		capitalization = "false",
		"guide-rulers": guideRulers = "none",
		typesetting = "false",
		"optical-alignment": opticalAlignment = "on",
		hyphenation = "on",
		theme = "caramel",
		"semantic-spacing": semanticSpacing = "off",
	} = cookies
	
	let value =
	{
		capitalization,
		"guide-rulers": guideRulers,
		typesetting,
		"optical-alignment": opticalAlignment,
		hyphenation,
		theme,
		"semantic-spacing": semanticSpacing,
		main,
		title,
		name,
		feedback,
	}
	
	template(s => res.write(s), value)
	
	res.end()
}
