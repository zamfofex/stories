let checkbox = document.querySelector("#capitalization")

checkbox.disabled = false
checkbox.closest("label").classList.remove("disabled")

checkbox.addEventListener("change", () => document.body.classList.toggle("capitalization", checkbox.checked))
