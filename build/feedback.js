import md from "commonmark"
import formatDate from "./dates.js"

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

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

export default feedback =>
{
	let result = ""
	for (let {message, response, date} of feedback)
	{
		result += `<article><header><p>on `
		result += formatDate(date)
		result += `, someone said:</p></header>`
		
		result += processFeedback(message)
		
		result += `</article>`
		
		if (response)
		{
			result += `<article class="response"><header><p>response from the author:</p></header>`
			result += processFeedback(response)
			result += `</article>`
		}
	}
	return `<!--#feedback-->${result}<!--/#feedback-->`
}
