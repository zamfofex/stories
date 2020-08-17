let checkbox = document.querySelector("#capitalization")

checkbox.disabled = false
checkbox.closest("label").classList.remove("disabled")

let update = () => document.body.classList.toggle("capitalization", checkbox.checked)
checkbox.addEventListener("change", update)
new BroadcastChannel("capitalization").addEventListener("message", update)
update()
