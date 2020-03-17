import Hypher from "hypher"
import english from "hyphenation.en-us"
import {breakLines} from "tex-linebreak"
import LineBreaker from "linebreak"

let hypher = new Hypher(english)

let ctx = document.createElement("canvas").getContext("2d")

let font = element =>
{
	let {fontStyle, fontWeight, fontSize, fontFamily} = getComputedStyle(element)
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

let defaultFont = font(document.body)
ctx.font = defaultFont

let typesetting = document.querySelector("#typesetting")
let pull = document.querySelector("#typesetting-pull")
let hyphens = document.querySelector("#typesetting-hyphens")
let capitalization = document.querySelector("#capitalization")

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
	
	let computedWidths = {}

	for (let letter in ratios)
		computedWidths[letter] = measure(letter)
	
	hyphenWidth = measure("\u2010")
	
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
		
		let push = (base, node, width, left, right) =>
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
			let text = textNode.data
			text = hypher.hyphenateText(text)
			
			let breaker = new LineBreaker(text)
			
			let last = 0
			let lbreak
			
			let syllables = []
			while (lbreak = breaker.nextBreak())
			{
				let [whole, syllable, shy, whitespace] = text.slice(last, lbreak.position).match(/^(.*?)(\xAD?)(\s*)$/)
				last = lbreak.position
				
				syllables.push({syllable, whitespace, shy})
			}
			
			let length = syllables.length
			
			currentNodes = []
			
			for (let i = 0 ; i < length ; i++)
			{
				let {syllable, shy, whitespace} = syllables[i]
				
				let normalized
				if (capitalization.checked) normalized = syllable
				else normalized = syllable.toLowerCase()
				
				let [whole, left, letters, right] = normalized.match(/^([\.,“”‘’—–‐:;TYCcOo]?)(.*?)([\.,“”‘’—–‐:;]?)$/)
				if (!letters) right = left
				if (shy) right = ""
				let leftWidth = computedWidths[left] || 0
				let rightWidth = computedWidths[right] || 0
				leftWidth *= ratios[left] || 0
				rightWidth *= ratios[right] || 0
				
				ctx.font = font(textNode.parentNode)
				
				push(
					{type: "box"},
					new Text(syllable),
					measure(syllable),
					leftWidth,
					rightWidth,
				)
				
				if (shy)
				{
					let shy = document.createElement("span")
					shy.classList.add("shy")
					let br = document.createElement("span")
					br.classList.add("br")
					shy.append(br)
					
					push({type: "penalty", flagged: false}, shy)
				}
				else
				{
					let spaceWidth
					if (syllables[i+1])
						spaceWidth = measure(syllable + " " + syllables[i+1].syllable) - measure(syllable) - measure(syllables[i+1].syllable)
					else
						spaceWidth = measure(" ")
					
					if (whitespace)
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
								shrink: spaceWidth / 8,
							},
							glue,
							spaceWidth,
						)
					}
					else
					{
						let glue = document.createElement("span")
						glue.classList.add("glue")
						
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
							0,
						)
					}
				}
			}
			
			let end = document.createElement("span")
			end.classList.add("paragraph-end")
			textNode.replaceWith(...currentNodes, end)
		}
	}
	
	typeset()
}

let typeset = () =>
{
	pull.disabled = !typesetting.checked
	hyphens.disabled = !typesetting.checked
	if (!typesetting.checked) return
	
	for (let current of document.querySelectorAll(".break"))
		current.classList.remove("break")
	for (let current of document.querySelectorAll(".last-line"))
		current.classList.remove("last-line")
	
	for (let {bases, nodes, widths, lefts, rights, node, shys} of paragraphs)
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
				
				if (base.type === "glue")
				{
					let next = lefts[i + 1] || 0
					let prev = rights[i - 1] || 0
					
					width += next + prev
				}
			}
			
			return {...base, width}
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
typesetting.addEventListener("change", prepare)
pull.addEventListener("change", typeset)
hyphens.addEventListener("change", typeset)
capitalization.addEventListener("change", typeset)
addEventListener("resize", typeset)
