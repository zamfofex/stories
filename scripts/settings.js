let settings = document.querySelector("#settings")
settings.addEventListener("submit", e => e.preventDefault())

settings.querySelector(".submit").remove()

for (let input of settings.elements)
{
	if (input.type === "checkbox")
		input.addEventListener("change", () => document.cookie = `${input.name}=${input.checked ? input.value : "off"};Max-Age=2592000`)
	else if (input.type === "radio")
		input.addEventListener("change", () => { if (input.checked) document.cookie = `${input.name}=${input.value};Max-Age=2592000` })
	else
		input.addEventListener("change", () => document.cookie = `${input.name}=${input.value||"off"};Max-Age=2592000`)
}
