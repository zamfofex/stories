import EasyMDE from "easymde"

let textarea = document.querySelector(`textarea[name="message"]`)

let mde = document.querySelector("#easy-mde")
let markdown = document.querySelector("#markdown")

let easyMDE

mde.addEventListener("change", () =>
{
	easyMDE = new EasyMDE(
	{
		element: textarea,
		autoDownloadFontAwesome: false,
		blockStyles: {code: "~~~"},
		indentWithTabs: false,
		minHeight: "0",
		parsingConfig: {strikethrough: false},
		renderingConfig: {singleLineBreaks: false},
		status: false,
		toolbar: false,
		tabSize: 4,
		spellChecker: false,
		styleSelectedText: false,
		shortcuts:
		{
			togglePreview: null,
			toggleSideBySide: null,
			toggleFullScreen: null,
		}
	})
})

markdown.addEventListener("change", () => easyMDE.toTextArea())

mde.disabled = false
markdown.disabled = false
mde.closest("p").classList.remove("disabled")
