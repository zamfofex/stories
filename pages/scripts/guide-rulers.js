import {subscribe} from "./messages.js"

let main = document.querySelector("main")

let update = visible =>
{
	if (visible === "off")
	{
		document.body.dataset.guideRulers = "none"
		return
	}
	
	let count = Math.round((64 - main.offsetWidth / 16) / 8)
	
	if (count < 3) count = "3"
	if (count > 6) count = "6"
	
	document.body.dataset.guideRulers = count
}

addEventListener("resize", () => update("on"))

subscribe("guide-rulers", update)
