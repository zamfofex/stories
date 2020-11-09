let checkbox = document.querySelector("#guide-rulers")

checkbox.closest("label").classList.remove("disabled")
checkbox.disabled = false

let main = document.querySelector("main")

let update = () =>
{
	if (!checkbox.checked)
	{
		document.body.dataset.guideRulers = "none"
		return
	}
	
	let count = Math.round((64 - main.offsetWidth / 16) / 8)
	
	if (count < 3) count = "3"
	if (count > 6) count = "6"
	
	document.body.dataset.guideRulers = count
}

addEventListener("resize", update)

new BroadcastChannel("guide-rulers").addEventListener("message", update)
addEventListener("load", update)
