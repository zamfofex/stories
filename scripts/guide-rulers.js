let group = document.querySelector("#guide-rulers")

group.closest("fieldset").classList.remove("disabled")

for (let radio of group.querySelectorAll("input"))
{
	radio.disabled = false
	if (radio.checked) document.body.dataset.guideRulers = radio.value
}

new BroadcastChannel("guide-rulers").addEventListener("message", ({data}) => document.body.dataset.guideRulers = data)
