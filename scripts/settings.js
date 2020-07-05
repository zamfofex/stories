let settings = document.querySelector("#settings")

for (let input of settings.querySelectorAll("input, select"))
{
	let value = localStorage.getItem(input.id || input.name)
	if (value)
	{
		if (input.type === "checkbox")
		{
			if (value !== "off") input.checked = true
		}
		else if (input.type === "radio")
		{
			if (value === input.value) input.checked = true
		}
		else
		{
			input.value = value
		}
	}
	
	if (input.type === "checkbox")
		input.addEventListener("change", () => localStorage.setItem(input.id, input.checked ? input.value : "off"))
	else if (input.type === "radio")
		input.addEventListener("change", () => { if (input.checked) localStorage.setItem(input.name, input.value) })
	else
		input.addEventListener("change", () => localStorage.setItem(input.id, input.value||"off"))
}
