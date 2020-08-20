import dbRequest from "./indexed-db.js"

dbRequest.addEventListener("success", async () =>
{
	let checkbox = document.querySelector("#available-offline")
	
	let db = dbRequest.result
	
	let name = location.pathname.split("/")[1]
	
	checkbox.addEventListener("change", async () =>
	{
		if (!checkbox.checked && !navigator.onLine) disable()
		
		db
			.transaction("offline-pages", "readwrite")
			.objectStore("offline-pages")
			.put(checkbox.checked, name)
		
		let registration = await navigator.serviceWorker.ready
		registration.active.postMessage({name, available: checkbox.checked})
	})
	
	let store = db
		.transaction("offline-pages", "readwrite")
		.objectStore("offline-pages")
	
	let request = store.get(name)
	await new Promise(resolve => request.addEventListener("success", resolve))
	
	let {result} = request
	if (result === undefined)
	{
		result = true
		store.put(true, name)
		let registration = await navigator.serviceWorker.ready
		registration.active.postMessage({name, available: true})
	}
	
	checkbox.checked = result
	
	let label = checkbox.closest("label")
	
	let disable = () => { checkbox.disabled = true ; label.classList.add("disabled") }
	let enable = () => { checkbox.disabled = false ; label.classList.remove("disabled") }
	
	if (navigator.onLine) enable()
	
	let offline = () => !checkbox.checked && disable()
	
	addEventListener("offline", offline)
	addEventListener("online", enable)
})
