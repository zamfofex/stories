import md from "commonmark"

let renaming =
{
	linebreak: "hardbreak",
	emph: "em",
	code: "code_inline",
	block_quote: "blockquote",
	item: "list_item",
	code_block: "fence",
	thematic_break: "hr",
}

let types = [...Object.keys(renaming).map(k => renaming[k]), "paragraph", "bullet_list", "ordered_list", "heading", "strong", "link", "text", "softbreak", "list"]

let wrap = parser => (
{
	parse: markdown =>
	{
		let walker = parser.parse(markdown).walker()
		let tokens = []
		let current
		while (current = walker.next())
		{
			let {entering, node} = current
			let type = renaming[node.type]||node.type
			
			if (!types.includes(type)) continue
			
			if (["code_inline", "fence", "text"].includes(type)) { if (entering) tokens.push({type, content: node.literal, info: node.info}) ; continue }
			if (["softbreak", "hardbreak", "hr"].includes(type)) { if (entering) tokens.push({type}) ; continue }
			
			if (type === "list")
			{
				if (node.listType === "bullet") type = "bullet_list"
				else type = "ordered_list"
			}
			
			let attributes
			
			let result = {attrGet: name => attributes[name]}
			
			if (type === "ordered_list") attributes = {start: node.listStart}
			if (type === "heading") result.tag = `h${node.level}`
			if (type === "link") attributes = {href: node.destination, title: node.title}
			
			if (entering) type += "_open"
			else type += "_close"
			
			result.type = type
			
			tokens.push(result)
		}
		return tokens
	},
})

export default () => wrap(new md.Parser())
