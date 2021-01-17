import {dispatch} from "./messages.js"

let settings = document.querySelector("#settings")

for (let input of settings.querySelectorAll("input, select"))
{
	if (input.matches(".local")) continue
	
	let name = input.id || input.name
	
	let channel = new BroadcastChannel(name)
	
	let update = value =>
	{
		dispatch(name, value)
		if (input.type === "checkbox")
			input.checked = value !== "off"
		else if (input.type === "radio")
			value === input.value && (input.checked = true)
		else
			input.value = value
	}
	
	let value = localStorage.getItem(name)
	if (value) update(value)
	
	let broadcast = async value =>
	{
		localStorage.setItem(name, value)
		channel.postMessage(value)
		dispatch(name, value)
	}
	
	if (input.type === "checkbox")
		input.addEventListener("change", () => broadcast(input.checked ? input.value : "off"))
	else if (input.type === "radio")
		input.addEventListener("change", () => { if (input.checked) broadcast(input.value) })
	else
		input.addEventListener("change", () => broadcast(input.value||"off"))
	
	channel.addEventListener("message", ({data}) => update(data))
	
	if (!input.matches(".dependent"))
	{
		input.disabled = false
		input.closest("label").classList.remove("disabled")
	}
}

let details = settings.closest("#display-settings")

let confirm = document.createElement("button")
confirm.append("confirm changes")
confirm.addEventListener("click", () => details.open = false)

let submit = settings.querySelector(".submit")
submit.textContent = ""
submit.append(confirm)
