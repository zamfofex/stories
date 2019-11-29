import md from "commonmark"
import fs from "fs"
import jsdom from "jsdom"
import process from "process"

let fsp = fs.promises
let {JSDOM} = jsdom

let parser = new md.Parser()
let renderer = new md.HtmlRenderer()

let feedbackForm = document =>
{
	let inMessage = document.createElement("textarea")
	inMessage.name = "message"
	inMessage.required = true
	inMessage.minLength = 12
	let inSubmit = document.createElement("button")
	inSubmit.append("submit feedback")
	
	let message = document.createElement("p")
	let submit = document.createElement("p")
	message.append(inMessage)
	submit.append(inSubmit)
	submit.classList.add("submit")
	
	let form = document.createElement("form")
	form.append(message, submit)
	form.method = "POST"
	return form
}

let parseMarkdown = md =>
{
	let dom = new JSDOM(`<!doctype html><meta charset="utf-8"><body>` + renderer.render(parser.parse(md)))
	
	let {window: {document}} = dom
	
	let title = document.querySelector("h1").textContent
	
	document.title = title + " \u2014 " + "zambonifofex\u2019s stories"
	
	document.documentElement.lang = "en"
	
	let viewport = document.createElement("meta")
	viewport.name = "viewport"
	viewport.content = "width=device-width,initial-scale=1"
	
	let style = document.createElement("link")
	style.rel = "stylesheet"
	style.href = "/style.css"
	
	document.head.append(viewport, style)
	
	return document
}

let main = async () =>
{
	let names =
		(await fsp.readdir("stories"))
			.filter(path => path.endsWith(".md"))
			.map(path => path.slice(0, -3))
	
	fsp.writeFile("api/names.json", JSON.stringify(names))
	
	let pages = {}
	
	for (let name of names)
	{
		let document = parseMarkdown(await fsp.readFile("stories/" + name + ".md", "utf-8"))
		
		let listLink = document.createElement("a")
		listLink.href = "/"
		listLink.append("list of stories")
		
		let list = document.createElement("p")
		list.append(listLink)
		
		let h2 = document.createElement("h2")
		h2.append("feedback")
		
		let form = feedbackForm(document)
		form.action = `/${name}/feedback`
		
		let license = document.createElement("footer")
		
		let ccby = document.createElement("a")
		ccby.append("creative commons attribution 4.0 international")
		ccby.href = `https://creativecommons.org/licenses/by/4.0`
		ccby.rel = "license"
		
		license.append("this story is licensed under ", ccby, ".")
		
		document.body.append(license, list, h2, form)
		
		let page = document.documentElement.outerHTML
		// Note: ‘lastIndexOf’ should be faster, since ‘</body>’ is closer to the end of the string.
		let i = page.lastIndexOf("</body>")
		pages[name] = [`<!-- This story is licensed under CC BY 4.0. See https://fanstories.now.sh/license to know more about the application of such license to this page. -->\n<!doctype html>\n${page.slice(0, i)}`, page.slice(i) + "\n"]
	}
	
	await Promise.all([
		fsp.writeFile(`api/pages.json`, JSON.stringify(pages)),
		fsp.writeFile(`public/license.html`, `<!doctype html>\n${parseMarkdown(await fsp.readFile("licenses/readme.md", "utf-8")).documentElement.outerHTML}\n`)
	])
}

main().catch(error => { console.error(error) ; process.exit(1) })
