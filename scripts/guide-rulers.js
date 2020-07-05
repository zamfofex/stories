let group = document.querySelector("#guide-rulers")

group.closest("p").classList.remove("disabled")

for (let radio of group.querySelectorAll("input"))
{
	radio.disabled = false
	radio.addEventListener("change", () => document.body.dataset.guideRulers = radio.value)
	if (radio.checked) document.body.dataset.guideRulers = radio.value
}
