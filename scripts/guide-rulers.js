for (let radio of document.querySelectorAll(`#settings input[name="guide-rulers"]`))
	radio.addEventListener("change", () => document.body.setAttribute("data-guide-rulers", radio.value))
