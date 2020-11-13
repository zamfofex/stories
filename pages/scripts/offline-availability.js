let main = async () =>
{
	let checkbox = document.querySelector("#available-offline")
	
	let label = checkbox.closest("label")
	
	let disable = () => { checkbox.disabled = true ; label.classList.add("disabled") }
	let enable = () => { checkbox.disabled = false ; label.classList.remove("disabled") }
	
	let name = location.pathname.match(/^\/?([^]*?)\/?$/)[1]
	
	let channel = new BroadcastChannel(name + ":available-offline")
	
	let sw = (await navigator.serviceWorker.ready).active
	
	let resolve
	let promises = [new Promise(f => resolve = f)]
	
	navigator.serviceWorker.addEventListener("message", ({data}) =>
	{
		resolve(data)
		promises.push(new Promise(f => resolve = f))
	})
	
	sw.postMessage(true)
	
	let {result, buffer} = await promises.shift() || {}
	
	let modifying = false
	
	let changed = async () =>
	{
		if (modifying) return
		let available = checkbox.checked
		try
		{
			if (available || buffer) enable()
			else disable()
			
			if (available)
			{
				if (!buffer) throw new Error()
				sw.postMessage(buffer)
			}
			else
			{
				sw.postMessage(null)
			}
			
			buffer = await promises.shift()
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
		if (data) enable()
		else !buffer && disable()
	})
	
	checkbox.checked = result
	changed()
}

main()
