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
		},
		forceSync: true,
	})
})

markdown.addEventListener("change", () => easyMDE.toTextArea())

mde.disabled = false
markdown.disabled = false
mde.closest("p").classList.remove("disabled")

let form = textarea.closest("form")

form.querySelector(".submit button").addEventListener("click", event =>
{
	if (mde.checked && !form.checkValidity())
	{
		event.preventDefault()
		easyMDE.toTextArea()
		markdown.checked = true
		form.reportValidity()
	}
})
