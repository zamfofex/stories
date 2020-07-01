let group = document.querySelector("#guide-rulers")

group.classList.remove("disabled")

for (let radio of group.querySelectorAll("input"))
{
	radio.disabled = false
	radio.addEventListener("change", () => document.body.setAttribute("data-guide-rulers", radio.value))
}
