let checkbox = document.querySelector(`#settings input[name="capitalization"]`)

checkbox.addEventListener("change", () => document.body.classList.toggle("capitalization", checkbox.checked))
