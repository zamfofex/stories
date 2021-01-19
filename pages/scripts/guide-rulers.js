import {subscribe} from "./messages.js"

let main = document.querySelector("main")

let update = () =>
{
	if (enabled === "off")
	{
		document.body.dataset.guideRulers = "none"
		return
	}
	
	let count = Math.round((64 - main.offsetWidth / 16) / 8)
	
	if (count < 3) count = "3"
	if (count > 6) count = "6"
	
	document.body.dataset.guideRulers = count
}

let enabled = "off"

addEventListener("resize", update)

subscribe("guide-rulers", value => { enabled = value ; update() })
