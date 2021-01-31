import {Hypher, english, breakLines} from "./dependencies.js"
import {subscribe, unsubscribe} from "./messages.js"

let hypher = new Hypher(english)

let canvas
if (window.OffscreenCanvas)
	canvas = new OffscreenCanvas(0, 0)
else
	canvas = document.createElement("canvas")
let ctx = canvas.getContext("2d")

let font = element =>
{
	let {fontStyle, fontWeight, fontSize, fontFamily} = getComputedStyle(element)
	return `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`
}

let typesetting = document.querySelector("#typesetting")
let hyphens = document.querySelector("#hyphenation")
let capitalization = document.querySelector("#capitalization")

let update = enabled => document.body.classList.toggle("typesetting", enabled !== "off")
subscribe("typesetting", update)

let measure = text => ctx.measureText(text).width

let ratios =
{
	".": 1,
	",": 1,
	"“": 1,
	"”": 1,
	"‘": 1,
	"’": 1,
	"-": 1,
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

let main = document.querySelector("main")
let children = [...main.childNodes]
let original = children.map(node => node.cloneNode(true))

let prepare = () =>
{
	subscribe("typesetting", typeset)
	subscribe("optical-alignment", typeset)
	subscribe("hyphenation", typeset)
	subscribe("capitalization", typeset)
	
	addEventListener("resize", () =>
	{
		if (main.offsetWidth === lastWidth) return
		typeset()
	})
	
	ctx.font = font(document.body)
	
	let computedOffsets = {}
	
	for (let letter in ratios) computedOffsets[letter] = measure(letter) * ratios[letter]
	
	hyphenWidth = measure("-")
	spaceWidth = measure(" ")
	
	for (let node of main.querySelectorAll("main > p, main > :not(footer):not(.end) p"))
	{
		node.classList.add("p")
		
		let bases = []
		let nodes = []
		let normal = {lefts: [], rights: [], widths: []}
		let lowercase = {lefts: [], rights: [], widths: []}
		let shys = []
		let currentNodes
		paragraphs.push({node, bases, nodes, normal, lowercase, shys})
		
		let push = (base, node) =>
		{
			if (base.type === "penalty") shys.push(bases.length)
			bases.push(base)
			nodes.push(node)
			currentNodes.push(node)
		}
		
		let textNodes = []
		
		let walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
		let textNode
		while (textNode = walker.nextNode()) textNodes.push(textNode)
		
		for (let textNode of textNodes)
		{
			let words = textNode.data.split(/([a-z]+|[^a-z\s]+)/ig)
			
			currentNodes = []
			
			for (let j = 0 ; true ; j += 2)
			{
				let whitespace = words[j]
				let word = words[j + 1]
				
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
					
					push({type: "glue", stretch: 1, shrink: 0}, glue)
				}
				
				if (!word) break
				
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
				
				if (bases.length && bases[bases.length - 1].type === "box")
				{
					flag = true
					nodes[nodes.length - 1].append(syllables.shift())
				}
				
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
					
					let left = syllable[0]
					let right = syllable[syllable.length-1]
					
					let span = document.createElement("span")
					span.classList.add("box")
					span.append(syllable)
					
					push({type: "box"}, span)
				}
			}
			
			textNode.replaceWith(...currentNodes)
		}
		
		push({type: "glue", stretch: 1, shrink: 0}, null)
		
		for (let node of nodes)
		{
			let textContent
			if (node)
				textContent = node.textContent,
				ctx.font = font(node)
			else
				textContent = ""
			for (let [text, {widths, rights, lefts}] of [[textContent, normal], [textContent.toLowerCase(), lowercase]])
			{
				widths.push(measure(text))
				
				let first = text[0]
				let last = text[text.length - 1]
				if (last === "c" || last === "C") last = ""
				
				lefts.push(computedOffsets[first])
				rights.push(computedOffsets[last])
			}
		}
	}
	
	typeset()
}

let lastWidth

let typeset = () =>
{
	let typesetting = document.body.matches(".typesetting")
	
	if (!typesetting)
	{
		main.textContent = ""
		main.append(...original)
		return
	}
	
	let mainWidth = main.offsetWidth
	
	lastWidth = mainWidth
	
	let y = scrollY
	
	main.textContent = ""
	
	for (let {node, bases, nodes, normal, lowercase, shys} of paragraphs)
	{
		let which
		if (capitalization.checked) which = normal
		else which = lowercase
		let {widths, lefts, rights} = which
		
		if (hyphens.checked)
			for (let i of shys) bases[i].cost = 400, widths[i] = 0
		else
			// 1000 is a special value that disallows line breaks.
			for (let i of shys) bases[i].cost = 1000
		
		let length = bases.length - 1
		
		for (let i = length - 1 ; i >= 0 ; i--)
		{
			let base = bases[i]
			let width = widths[i]
			
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
			
			base.width = width
		}
		
		let indices = breakLines(bases, mainWidth, {doubleHyphenPenalty: 300, adjacentLooseTightPenalty: 100})
		indices.shift()
		
		for (let i = 0 ; i < length ; i++)
			nodes[i].classList.remove("break")
		
		for (let i of indices)
		{
			let node = nodes[i]
			node.classList.add("break")
			
			if (bases[i].type === "penalty")
				node.style.setProperty("--pull-left", `${hyphenWidth}px`)
			else
				node.style.setProperty("--pull-left", `${rights[i - 1] || 0}px`)
			
			node.style.setProperty("--pull-right", `${lefts[i + 1] || 0}px`)
		}
		
		node.style.setProperty("--pull-before", `${lefts[0] || 0}px`)
		
		let push = mainWidth
		
		for (let i = indices[indices.length-1] ; i < length ; i++)
		{
			let {type, width} = bases[i]
			if (type === "box") push -= width
			else if (type === "glue") push -= spaceWidth + spaceWidth/16
		}
		
		if (push < 0) push = 0
		
		node.style.setProperty("--push", `${push}px`)
		
		let prev = 0
		
		for (let i = 0 ; i < length ; i++)
			nodes[i].classList.remove("spacing-offset")
		
		for (let i of indices)
		{
			let width = 0
			let glues = 0
			let gaps = -1
			for (let j = prev ; j < i ; j++)
			{
				let base = bases[j]
				if (base.type === "glue")
					glues++, gaps--
				else if (base.type === "box")
					if (capitalization.checked) width += widths[j]
					else width += widths[j]
				
				if (base.type === "box")
					gaps += nodes[j].childNodes[0].data.length
			}
			
			let spacing = ((mainWidth - width) / glues - 1.75 * spaceWidth) * glues / gaps / 1.25
			
			let value
			if (spacing > 0) value = `${spacing}px`
			else value = "0"
			
			for (let j = prev ; j < i ; j++)
				if (bases[j].type === "box") nodes[j].style.setProperty("--spacing", value)
			
			nodes[i - 1].classList.add("spacing-offset")
			
			prev = i + 1
		}
		
		for (let j = prev ; j < length ; j++)
			if (bases[j].type === "box") nodes[j].style.setProperty("--spacing", "0")
	}
	
	main.append(...children)
	scrollY = y
}

document.fonts.ready.then(() =>
{
	if (document.body.matches(".typesetting"))
	{
		prepare()
	}
	else
	{
		let prepare2 = () =>
		{
			prepare()
			unsubscribe("typesetting", prepare2)
		}
		subscribe("typesetting", prepare2)
	}
})
