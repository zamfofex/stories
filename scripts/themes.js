let select = document.querySelector(`#settings select[name="theme"]`)
let theme = select.closest("label")
select.addEventListener("change", () => document.body.dataset.theme = select.value)

if (CSS.registerProperty)
{
	CSS.registerProperty({name: "--text-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
	CSS.registerProperty({name: "--background-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
}
