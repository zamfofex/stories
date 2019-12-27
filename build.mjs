import md from "commonmark"
import fs from "fs"
import process from "process"

let fsp = fs.promises

let parser = new md.Parser()
let renderer = new md.HtmlRenderer()

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
		let title = "unknown"
		let tree = parser.parse(await fsp.readFile("stories/" + name + ".md", "utf-8"))
		
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
		
		pages[name] = {title: title.toLowerCase(), main: renderer.render(tree)}
	}
	
	await fsp.writeFile(`api/pages.json`, JSON.stringify(pages))
}

main().catch(error => { console.error(error) ; process.exit(1) })
