import {EditorView} from "prosemirror-view"
import {EditorState, Plugin} from "prosemirror-state"
import {schema, defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser, MarkdownSerializer} from "prosemirror-markdown"
import {buildKeymap} from "prosemirror-example-setup"
import {inputRules} from "prosemirror-inputrules"
import {history} from "prosemirror-history"
import {baseKeymap, toggleMark, setBlockType, wrapIn} from "prosemirror-commands"
import {Schema} from "prosemirror-model"
import {blockQuoteRule, orderedListRule, bulletListRule} from "prosemirror-example-setup/src/inputrules"
import {keymap} from "prosemirror-keymap"
import {wrapInList} from "prosemirror-schema-list"
import OrderedMap from "orderedmap"

let parser = new MarkdownParser(schema, defaultMarkdownParser.tokenizer, defaultMarkdownParser.tokens)

let serializer = new MarkdownSerializer(
	{
		...defaultMarkdownSerializer.nodes,
		code_block: (state, node) =>
		{
			state.write(`~~~${node.attrs.params || ""}\n`)
			state.text(node.textContent, false)
			state.ensureNewLine()
			state.write("~~~")
			state.closeBlock(node)
		},
		heading: (state, node) =>
		{
			switch (node.attrs.level)
			{
				case 1:
					state.renderInline(node)
					state.ensureNewLine()
					state.write("===")
					break
				case 2:
					state.renderInline(node)
					state.ensureNewLine()
					state.write("---")
					break
				default:
					state.write(state.repeat("#", node.attrs.level) + " ")
					state.renderInline(node)
					break
					
			}
			state.closeBlock(node)
		},
		horizontal_rule: (state, node) =>
		{
			state.write("- - -")
			state.closeBlock(node)
		},
		bullet_list: (state, node) => state.renderList(node, "  ", () => "+ "),
	},
	defaultMarkdownSerializer.marks,
)

let svgns = "http://www.w3.org/2000/svg"

let menuPlugin = new Plugin(
{
	view: view =>
	{
		let schema = view.state.schema
		
		let menu = document.createElement("p")
		menu.id = "menu"
		
		let update = []
		
		let button = (icon, title, css, action) =>
		{
			let text = document.createElementNS(svgns, "text")
			text.setAttribute("x", "50%")
			text.setAttribute("y", "50%")
			text.setAttribute("dominant-baseline", "middle")
			text.setAttribute("text-anchor", "middle")
			text.setAttribute("style", css)
			text.textContent = icon
			
			let svg = document.createElementNS(svgns, "svg")
			svg.setAttribute("viewBox", "0 0 24 24")
			
			svg.append(text)
			
			let button = document.createElement("button")
			button.type = "button"
			button.append(svg)
			button.addEventListener("click", () => action(view.state, view.dispatch, view))
			button.title = title
			
			menu.append(button)
			
			let f = () => button.disabled = !action(view.state, null, view)
			update.push(f)
			f()
		}
		
		button("b", "strong emphasis (bold)", "font-weight: bold;", toggleMark(schema.marks.strong))
		button("i", "emphasis (italic)", "font-style: italic;", toggleMark(schema.marks.em))
		button("h1", "primary heading", "", setBlockType(schema.nodes.heading, {level: 1}))
		button("h2", "secondary heading", "", setBlockType(schema.nodes.heading, {level: 2}))
		button("h3", "tertiary heading", "", setBlockType(schema.nodes.heading, {level: 3}))
		button("\u2022", "bullet list", "", wrapInList(schema.nodes.bullet_list))
		button("i)", "ordered list", "", wrapInList(schema.nodes.ordered_list))
		button("“", "quotation", "font-size: 2em; transform: translate(0, 0.3em)", wrapIn(schema.nodes.blockquote))
		
		view.dom.before(menu)
		return {update: () => { for (let f of update) f() }, destroy: () => menu.remove()}
	},
})

let plugins =
[
	inputRules(
	{
		rules:
		[
			blockQuoteRule(schema.nodes.blockquote),
			orderedListRule(schema.nodes.ordered_list),
			bulletListRule(schema.nodes.bullet_list),
		],
	}),
	keymap(buildKeymap(schema, {Escape: false})),
	keymap(baseKeymap),
	menuPlugin,
	history(),
]

let textarea = document.querySelector(`textarea[name="message"]`)

let feedback = textarea.parentElement

let prosemirror = document.querySelector("#prosemirror")
let markdown = document.querySelector("#markdown")
prosemirror.closest("p").classList.remove("disabled")

let view

let editor = document.createElement("article")
editor.id = "feedback"

prosemirror.addEventListener("change", () =>
{
	let doc = parser.parse(textarea.value)
	view = new EditorView(editor, {state: EditorState.create({plugins, doc})})
	feedback.replaceWith(editor)
})

markdown.addEventListener("change", () =>
{
	textarea.value = serializer.serialize(view.state.doc)
	editor.replaceWith(feedback)
	view.destroy()
})

prosemirror.disabled = false
markdown.disabled = false

let form = document.querySelector("form")
let submit = form.querySelector(".submit button")
form.addEventListener("submit", event =>
{
	submit.disabled = true
	if (prosemirror.checked)
	{
		textarea.value = serializer.serialize(view.state.doc)
		editor.replaceWith(feedback)
		view.destroy()
		markdown.checked = true
		if (!form.reportValidity())
		{
			submit.disabled = false
			event.preventDefault()
		}
	}
})
