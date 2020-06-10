import Hypher from "hypher"
import english from "hyphenation.en-us"
import linebreak from "tex-linebreak"
let {breakLines} = linebreak
import parse from "compromise"

let hypher = new Hypher(english)

let ctx = document.createElement("canvas").getContext("2d")

let font = element =>
{
	let {fontStyle, fontWeight, fontSize, fontFamily} = getComputedStyle(element)
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

let typesetting = document.querySelector(`#settings input[name="typesetting"]`)
let pull = document.querySelector(`#settings input[name="optical-alignment"]`)
let hyphens = document.querySelector(`#settings input[name="hyphenation"]`)
let capitalization = document.querySelector(`#settings input[name="capitalization"]`)
let spacing = document.querySelector(`#settings input[name="semantic-spacing"]`)

typesetting.addEventListener("change", () => document.body.classList.toggle("typesetting", typesetting.checked))
pull.addEventListener("change", () => document.body.classList.toggle("optical-alignment", pull.checked))
spacing.addEventListener("change", () => document.body.classList.toggle("semantic-spacing", spacing.checked))

let measure = text => ctx.measureText(capitalization.checked ? text : text.toLowerCase()).width

let ratios =
{
	".": 1,
	",": 1,
	"“": 1,
	"”": 1,
	"‘": 1,
	"’": 1,
	":": 1,
	";": 1,
	"‐": 0.75,
	"–": 0.5,
	"—": 0.25,
	"T": 0.2,
	"Y": 0.2,
	"C": 0.1,
	"O": 0.1,
	"c": 0.1,
	"o": 0.1,
}

let hyphenWidth

let paragraphs = []

let prepare = () =>
{
	typesetting.removeEventListener("change", prepare)
	typesetting.addEventListener("change", typeset)
	pull.addEventListener("change", typeset)
	hyphens.addEventListener("change", typeset)
	capitalization.addEventListener("change", typeset)
	spacing.addEventListener("change", typeset)
	window.addEventListener("resize", typeset)
	
	ctx.font = font(document.body)
	
	let computedWidths = {}
	
	for (let letter in ratios)
		computedWidths[letter] = measure(letter)
	
	hyphenWidth = measure("\u2010")
	
	let spaceWidth = measure(" ")
	
	for (let node of document.querySelectorAll("main > p, main > :not(footer) p"))
	{
		node.classList.add("p")
		
		let bases = []
		let nodes = []
		let widths = []
		let lefts = []
		let rights = []
		let shys = []
		let wides = []
		let currentNodes
		paragraphs.push({bases, nodes, widths, lefts, rights, node, shys, wides})
		
		let push = (base, node, {width, left, right, wide} = {}) =>
		{
			if (base.type === "penalty") shys.push(bases.length)
			bases.push(base)
			nodes.push(node)
			currentNodes.push(node)
			widths.push(width)
			lefts.push(left)
			rights.push(right)
			wides.push(wide)
		}
		
		let textNodes = []
		
		let walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
		let textNode
		while (textNode = walker.nextNode()) textNodes.push(textNode)
		
		for (let textNode of textNodes)
		{
			let {data} = textNode
			
			currentNodes = []
			
			if (/^\s+$/.test(data)) continue
			
			// TODO: Consider situations where a paragraph is interrupted by elements boundaries.
			for (let {terms} of parse(data).clauses().json())
			{
				for (let {length} = terms, i = 0 ; i < length ; i++)
				{
					let current = terms[i]
					let next = terms[i+1]||{}
					
					let syllables
					
					if (current.tags.includes("ProperNoun")) syllables = [current.text]
					else syllables = hypher.hyphenate(current.text)
					
					let post = current.post + (next.pre||"")
					
					for (let {length} = syllables, i = 0 ; i < length ; i++)
					{
						let syllable = syllables[i]
						
						let shy = document.createElement("span")
						shy.classList.add("shy")
						let br = document.createElement("span")
						br.classList.add("br")
						shy.append(br)
						
						let normalized
						if (capitalization.checked) normalized = syllable
						else normalized = syllable.toLowerCase()
						
						let [whole, left, letters, right] = normalized.match(/^([TYCcOo]?)(.*?)([]?)$/)
						if (!letters) right = left
						if (i !== length - 1) right = ""
						let leftWidth = computedWidths[left] || 0
						let rightWidth = computedWidths[right] || 0
						leftWidth *= ratios[left] || 0
						rightWidth *= ratios[right] || 0
						
						ctx.font = font(textNode.parentNode)
						
						if (i !== 0) push({type: "penalty", flagged: false}, shy)
						push(
							{type: "box"},
							new Text(syllable),
							{
								width: measure(normalized),
								left: leftWidth,
								right: rightWidth,
							}
						)
					}
					
					if (!post) continue
					
					let whitespace = post.split(/(\S+)/)
					
					if (whitespace.length > 1)
					{
						for (let {length} = whitespace, i = 0 ; i < length ; i += 2)
						{
							let glue = whitespace[i + 0]
							let symbol = whitespace[i + 1]
							
							if (glue)
							{
								let glue = document.createElement("span")
								glue.classList.add("glue")
								let ws = document.createElement("span")
								ws.classList.add("ws")
								ws.append(" ")
								glue.append(ws)
								
								let br = document.createElement("span")
								br.classList.add("br")
								glue.append(br)
								
								push(
									{
										type: "glue",
										stretch: spaceWidth / 2,
										shrink: 0,
									},
									glue,
									{
										width: spaceWidth,
										wide: 1,
									}
								)
							}
							if (symbol)
							{
								let right = symbol[symbol.length-1]
								let rightWidth = computedWidths[right] || 0
								rightWidth *= ratios[right] || 0
								
								font(textNode.parentNode)
								
								push(
									{type: "box"},
									new Text(symbol),
									{
										width: measure(symbol),
										left: 0,
										right: rightWidth,
									}
								)
							}
						}
						continue
					}
					
					let wide = 1
					
					if (i === length - 1)
					{
						wide = 3
					}
					else if (current.tags.includes("Noun") !== (!next.tags.includes("Noun")))
					{
						wide = 2
					}
					else if (current.tags.includes("Verb") !== (!next.tags.includes("Verb")))
					{
						wide = 1.5
					}
					
					let glue = document.createElement("span")
					glue.classList.add("glue")
					let ws = document.createElement("span")
					ws.classList.add("ws")
					ws.append(" ")
					glue.append(ws)
					
					let br = document.createElement("span")
					br.classList.add("br")
					glue.append(br)
					
					push(
						{
							type: "glue",
							stretch: spaceWidth / 2,
							shrink: 0,
						},
						glue,
						{
							width: spaceWidth,
							wide,
						}
					)
				}
			}
			
			let end = document.createElement("span")
			end.classList.add("paragraph-end")
			textNode.replaceWith(...currentNodes, end)
		}
	}
	
	typeset()
}

let pullLabel = pull.closest("label")
let hyphensLabel = hyphens.closest("label")
let spacingLabel = spacing.closest("label")

let typeset = () =>
{
	pull.disabled = !typesetting.checked
	hyphens.disabled = !typesetting.checked
	spacing.disabled = !typesetting.checked
	
	pullLabel.classList.toggle("disabled", pull.disabled)
	hyphensLabel.classList.toggle("disabled", hyphens.disabled)
	spacingLabel.classList.toggle("disabled", spacing.disabled)
	
	if (!typesetting.checked) return
	
	for (let current of document.querySelectorAll(".break"))
		current.classList.remove("break")
	for (let current of document.querySelectorAll(".last-line"))
		current.classList.remove("last-line")
	
	for (let {bases, nodes, widths, lefts, rights, node, shys, wides} of paragraphs)
	{
		node.classList.remove("no-break")
		
		let shyWidth
		
		if (pull.checked) shyWidth = hyphenWidth * 0.75
		else shyWidth = hyphenWidth
		
		if (hyphens.checked)
			for (let i of shys) { bases[i].cost = 200 ; widths[i] = shyWidth }
		else
			// 1000 is a special value that disallows line breaks.
			for (let i of shys) bases[i].cost = 1000
		
		let items = bases.map((base, i) =>
		{
			let width = widths[i]
			
			if (pull.checked)
			{
				let left = lefts[i] || 0
				let right = rights[i] || 0
				
				width -= left + right
				width = Math.max(0, width)
				
				if (base.type === "glue")
				{
					let next = lefts[i + 1] || 0
					let prev = rights[i - 1] || 0
					
					width += next + prev
				}
			}
			
			let result = {...base, width}
			if (spacing.checked && base.type === "glue")
			{
				let wide = wides[i]
				
				nodes[i].style.setProperty("--spacing", `${result.width * (wide - 1) - 1}px`)
				
				result.width *= wide
				result.stretch *= wide
			}
			return result
		})
		
		let indices = breakLines(items, node.clientWidth, {doubleHyphenPenalty: 300, adjacentLooseTightPenalty: 100})
		indices.shift()
		
		for (let i of indices)
		{
			let node = nodes[i]
			
			node.classList.add("break")
			
			if (pull.checked)
			{
				if (bases[i].type === "penalty")
					node.style.setProperty("--pull-left", -hyphenWidth * 0.75 + "px")
				else
					node.style.setProperty("--pull-left", -rights[i - 1] + "px")
				
				node.style.setProperty("--pull-right", -lefts[i + 1] + "px")
			}
		}
		
		let length = nodes.length
		for (let i = (indices[indices.length - 1] || -1) + 1 ; i < length ; i++)
			if (bases[i].type === "glue") nodes[i].classList.add("last-line")
	}
}

typesetting.disabled = false
typesetting.closest("label").classList.remove("disabled")

addEventListener("load", () =>
{
	if (typesetting.checked) prepare()
	else typesetting.addEventListener("change", prepare)
})
