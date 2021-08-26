import "./typesetting.js"
import "./guide-rulers.js"
import "./hyphenation.js"
import "./pageshow-settings.js"

import {dispatch} from "./messages.js"

let settings = document.querySelector("#settings")

for (let input of settings.querySelectorAll("input"))
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
	
	let broadcastChange = () => broadcast(input.checked ? input.value : "off")
	broadcastChange()
	input.addEventListener("change", broadcastChange)
	
	channel.addEventListener("message", ({data}) => update(data))
	
	input.disabled = false
	input.closest("label").classList.remove("disabled")
}

let details = settings.closest("#display-settings")

let confirm = document.createElement("button")
confirm.append("confirm changes")
confirm.addEventListener("click", () => details.open = false)

let submit = settings.querySelector(".submit")
submit.textContent = ""
submit.append(confirm)
