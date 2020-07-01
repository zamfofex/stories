let select = document.querySelector("#theme")
let theme = select.closest("label")
select.addEventListener("change", () => document.body.dataset.theme = select.value)

select.disabled = false
theme.classList.remove("disabled")

if (CSS.registerProperty)
{
	CSS.registerProperty({name: "--text-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
	CSS.registerProperty({name: "--background-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
}
