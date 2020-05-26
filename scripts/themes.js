let theme = document.querySelector("#theme")
let select = theme.querySelector("select")
theme.classList.remove("disabled")
select.disabled = false
select.addEventListener("change", () => document.body.dataset.theme = select.value)

if (CSS.registerProperty)
{
	CSS.registerProperty({name: "--text-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
	CSS.registerProperty({name: "--background-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
}
