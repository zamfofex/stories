import Hypher from "hypher"
import english from "hyphenation.en-us"
import linebreak from "tex-linebreak"
let {breakLines} = linebreak

let hypher = new Hypher(english)

let ctx = document.createElement("canvas").getContext("2d")

let font = element =>
{
	let {fontStyle, fontWeight, fontSize, fontFamily} = getComputedStyle(element)
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

let typesetting = document.querySelector("#typesetting")
let pull = document.querySelector("#optical-alignment")
let hyphens = document.querySelector("#hyphenation")
let capitalization = document.querySelector("#capitalization")
let spacing = document.querySelector("#spacing-harmony")

for (let checkbox of [typesetting, pull, spacing])
{
	checkbox.addEventListener("change", () => document.body.classList.toggle(checkbox.id, checkbox.checked))
	document.body.classList.toggle(checkbox.id, checkbox.checked)
}

let measure = text => ctx.measureText(text).width

let ratios =
{
	".": 1,
	",": 1,
	"“": 1,
	"”": 1,
	"‘": 1,
	"’": 1,
	"‐": 1,
	"—": 0.25,
	"T": 0.2,
	"Y": 0.2,
	"C": 0.1,
	"O": 0.1,
	"c": 0.1,
	"o": 0.1,
}

let hyphenWidth
let spaceWidth

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
	
	for (let letter in ratios) computedWidths[letter] = measure(letter)
	
	hyphenWidth = measure("\u2010")
	spaceWidth = measure(" ")
	
	for (let node of document.querySelectorAll("main > p, main > :not(footer) p"))
	{
		node.classList.add("p")
		
		let bases = []
		let nodes = []
		let widths = []
		let lefts = []
		let rights = []
		let shys = []
		let currentNodes
		paragraphs.push({bases, nodes, widths, lefts, rights, node, shys})
		
		let push = (base, node, {width, left, right} = {}) =>
		{
			if (base.type === "penalty") shys.push(bases.length)
			bases.push(base)
			nodes.push(node)
			currentNodes.push(node)
			widths.push(width)
			lefts.push(left)
			rights.push(right)
		}
		
		let textNodes = []
		
		let walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
		let textNode
		while (textNode = walker.nextNode()) textNodes.push(textNode)
		
		for (let textNode of textNodes)
		{
			let words = textNode.data.split(/([a-z]+|[^a-z\s]+)/ig)
			
			currentNodes = []
			
			for (let {length} = words, j = 1 ; j < length ; j += 2)
			{
				let word = words[j + 0]
				let whitespace = words[j + 1]
				
				let syllables
				if (/[^a-z]/i.test(word) || word.length < 4)
				{
					syllables = [word]
				}
				else
				{
					syllables = hypher.hyphenate(word)
					
					let first = ""
					while (first.length < 4) first += syllables.shift()
					syllables.unshift(first)
					
					let last = ""
					while (last.length < 4) last = syllables.pop() + last
					syllables.push(last)
				}
				
				let flag = false
				for (let syllable of syllables)
				{
					if (flag)
					{
						let shy = document.createElement("span")
						shy.classList.add("shy")
						let br = document.createElement("span")
						br.classList.add("br")
						shy.append(br)
						push({type: "penalty"}, shy)
					}
					else
					{
						flag = true
					}
					
					let normalized
					if (capitalization.checked) normalized = syllable
					else normalized = syllable.toLowerCase()
					
					let left = normalized[0]
					let right = normalized[normalized.length-1]
					let leftWidth = computedWidths[left] || 0
					let rightWidth = computedWidths[right] || 0
					leftWidth *= ratios[left] || 0
					rightWidth *= ratios[right] || 0
					
					ctx.font = font(textNode.parentNode)
					
					let span = document.createElement("span")
					span.classList.add("box")
					span.append(syllable)
					
					push(
						{type: "box"},
						span,
						{
							width: measure(normalized),
							left: leftWidth,
							right: rightWidth,
						},
					)
				}
				
				if (!whitespace) continue
				
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
						stretch: 1,
						shrink: 0,
					},
					glue,
					{
						width: spaceWidth,
					},
				)
			}
			
			textNode.replaceWith(...currentNodes)
			
			push(
				{
					type: "glue",
					stretch: 1,
					shrink: 0,
				},
				null,
				{
					width: spaceWidth,
				},
			)
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
	
	let shyWidth
	if (pull.checked) shyWidth = 0
	else shyWidth = hyphenWidth
	
	for (let {bases, nodes, widths, lefts, rights, node, shys} of paragraphs)
	{
		if (hyphens.checked)
			for (let i of shys) { bases[i].cost = 400 ; widths[i] = shyWidth }
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
				
				if (base.type !== "box")
				{
					let next = lefts[i + 1] || 0
					let prev = rights[i - 1] || 0
					
					width += next + prev
				}
				
				if (width < 0) width = 0
			}
			
			return {...base, width}
		})
		
		let {clientWidth} = node
		
		if (pull.checked)
		{
			// 2em + 2em (compensation for negative margins)
			clientWidth -= 64
			
			node.style.setProperty("--pull-before", `${lefts[0]}px`)
		}
		
		let indices = breakLines(items, clientWidth, {doubleHyphenPenalty: 300, adjacentLooseTightPenalty: 100})
		indices.shift()
		
		for (let i of indices)
		{
			let node = nodes[i]
			node.classList.add("break")
			
			if (pull.checked)
			{
				if (bases[i].type === "penalty")
					node.style.setProperty("--pull-left", `${hyphenWidth}px`)
				else
					node.style.setProperty("--pull-left", `${rights[i - 1]}px`)
				
				node.style.setProperty("--pull-right", `${lefts[i + 1]}px`)
			}
		}
		
		if (!spacing.checked) continue
		
		let prev = -1
		
		for (let i of indices)
		{
			let width = 0
			let glues = 0
			let gaps = -1
			for (let j = prev + 1 ; j < i ; j++)
			{
				let base = bases[j]
				if (base.type === "glue")
					glues++, gaps--
				else
					width += widths[j]
				
				if (base.type === "box")
					gaps += nodes[j].childNodes[0].data.length
			}
			
			let spacing = ((clientWidth - width) / glues - 1.75 * spaceWidth) * glues / gaps / 1.25
			
			let value
			if (spacing > 0) value = `${spacing}px`
			else value = "0"
			
			for (let j = prev + 1 ; j <= i ; j++)
				nodes[j].style.setProperty("--spacing", value)
			
			prev = i
		}
		
		for (let length = nodes.length - 1, j = prev + 1 ; j < length ; j++)
			nodes[j].style.setProperty("--spacing", "0")
	}
}

typesetting.disabled = false
typesetting.closest("label").classList.remove("disabled")

addEventListener("load", () =>
{
	if (typesetting.checked) prepare()
	else typesetting.addEventListener("change", prepare)
})
