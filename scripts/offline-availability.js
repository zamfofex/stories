import dbRequest from "./indexed-db.js"

dbRequest.addEventListener("success", async () =>
{
	let checkbox = document.querySelector("#available-offline")
	
	let label = checkbox.closest("label")
	
	let disable = () => { checkbox.disabled = true ; label.classList.add("disabled") }
	let enable = () => { checkbox.disabled = false ; label.classList.remove("disabled") }
	
	let db = dbRequest.result
	
	let name = location.pathname.split("/")[1]
	
	let channel = new BroadcastChannel(name + ":available-offline")
	
	let response = await fetch(".")
	
	let modifying = false
	
	let changed = async () =>
	{
		if (modifying) return
		let available = checkbox.checked
		try
		{
			if (available || response.ok) enable()
			else disable()
			
			let request = db
				.transaction("offline-pages", "readwrite")
				.objectStore("offline-pages")
				.put(available, name)
			
			await new Promise((resolve, reject) => { request.addEventListener("success", resolve) ; request.addEventListener("error", reject) })
			
			if (available)
			{
				if (!response.ok) throw new Error()
				for (let name of await caches.keys())
				{
					let cache = await caches.open(name)
					await cache.put(".", response.clone())
				}
			}
			else
			{
				for (let name of await caches.keys())
				{
					let cache = await caches.open(name)
					await cache.delete(".")
				}
			}
		}
		catch (e)
		{
			available = false
		}
		finally
		{
			modifying = false
			if (checkbox.checked !== available) changed()
			else channel.postMessage(available)
		}
	}
	
	checkbox.addEventListener("change", changed)
	
	channel.addEventListener("message", ({data}) =>
	{
		checkbox.checked = data
		if (!data) !response.ok && disable()
		else enable()
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
	}
	
	await navigator.serviceWorker.ready
	
	checkbox.checked = result
	if (result) enable()
	else changed()
})
