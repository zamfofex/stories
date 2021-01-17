let db
let prepareDB = async () =>
{
	let request = indexedDB.open("cache")
	
	request.addEventListener("upgradeneeded", () =>
	{
		let db = request.result
		db.createObjectStore("offline-pages")
	})
	
	await new Promise((resolve, reject) => { request.addEventListener("success", resolve) ; request.addEventListener("error", reject) })
	db = request.result
}

let currentCacheName

let cacheNameReady = async () =>
{
	let keys = await caches.keys()
	let cacheName = currentCacheName
	if (!cacheName)
	{
		for (let name of keys)
		{
			if (await (await caches.open(name)).match("/hashes.json"))
			{
				cacheName = name
				break
			}
		}
		if (!cacheName) cacheName = String(Date.now())
	}
	for (let name of keys)
		if (name !== cacheName) await caches.delete(name)
	currentCacheName = cacheName
}

let computeHash = async buffer =>
{
	let array = Array.from(
		new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
		byte => byte.toString(0x10).padStart(2, "0")
	)
	return array.join("")
}

let main = async () =>
{
	await cacheNameReady()
	let cacheName = currentCacheName
	
	let cache = await caches.open(cacheName)
	
	let response = await fetch("/hashes.json")
	if (!response.ok) throw new Error()
	
	let hashes = await response.clone().json()
	
	for (let url in hashes)
	{
		let {hash, essential} = hashes[url]
		if (!essential) continue
		
		let response = await fetch(url)
		if (!response.ok) throw new Error()
		let buffer = await response.clone().arrayBuffer()
		let hash2 = await computeHash(buffer)
		if (hash !== hash2) throw new Error()
		await cache.put(url, response)
	}
	
	await cache.put("/hashes.json", response)
	
	skipWaiting()
}

addEventListener("install", event => event.waitUntil(main()))
addEventListener("activate", event => event.waitUntil(clients.claim()))

let cacheFirst = async (request, waitUntil) =>
{
	await cacheNameReady()
	let cacheName = currentCacheName
	
	let cache = await caches.open(cacheName)
	let response = await cache.match(request.url)
	if (response) return response
	response = await fetch(request)
	
	let cacheResponse = async () =>
	{
		if (!response.ok) return
		let url = new URL(request.url)
		if (url.origin !== location.origin) return cache.put(url, response)
	}
	
	let result = response.clone()
	
	waitUntil(cacheResponse())
	
	return result
}

let staleWhileRevalidate = async (request, waitUntil) =>
{
	await cacheNameReady()
	let cacheName = currentCacheName
	
	let cache = await caches.open(cacheName)
	
	let pathname = new URL(request.url).pathname.replace(/\/index\.html$/, "/")
	
	let refresh = async () =>
	{
		let hashesResponse = await cache.match("/hashes.json")
		if (!hashesResponse)
		{
			await revalidate()
			return fetch(request)
		}
		
		let response = await fetch(request)
		
		let hashes = await hashesResponse.json()
		let info = hashes[pathname]
		if (info && response.ok)
		{
			let hash = await computeHash(await response.clone().arrayBuffer())
			if (hash !== info.hash) await revalidate()
		}
		
		return response.clone()
	}
	
	let response = await cache.match(pathname)
	
	if (!response) response = await refresh()
	else waitUntil(refresh())
	
	return response
}

let availableOffline = async url =>
{
	if (!/^\/[^/]+\/$/.test(url)) return
	let name = url.split("/")[1]
	let request = db
		.transaction("offline-pages")
		.objectStore("offline-pages")
		.get(name)
	await new Promise((resolve, reject) => { request.addEventListener("success", resolve) ; request.addEventListener("error", reject) })
	return request.result
}

let revalidating
let changingAvailability = new Set()

let revalidate = async () =>
{
	if (revalidating) return
	let resolve
	revalidating = new Promise(f => resolve = f)
	
	while (changingAvailability.size) await Promise.all(changingAvailability)
	
	await cacheNameReady()
	
	let cacheName = currentCacheName
	let freshName = String(Date.now())
	
	try
	{
		let copyFonts = true
		let copyJSPM = true
		
		await prepareDB()
		
		let stale = await caches.open(cacheName)
		
		let hashesResponse = await stale.match("/hashes.json")
		let staleHashes
		if (hashesResponse) staleHashes = await hashesResponse.json()
		
		let fresh = await caches.open(freshName)
		
		let response = await fetch("/hashes.json")
		if (!response.ok) throw new Error()
		let freshHashes = await response.clone().json()
		
		for (let url in freshHashes)
		{
			let {hash, essential} = freshHashes[url]
			let hash2 = staleHashes && staleHashes[url] && staleHashes[url].hash
			if (hash === hash2)
			{
				let response = await stale.match(url)
				if (response) { await fresh.put(url, response) ; continue }
				if (!essential && !availableOffline(url)) continue
			}
			let response = await fetch(url)
			if (!response.ok) throw new Error()
			let buffer = await response.clone().arrayBuffer()
			let hash3 = await computeHash(buffer)
			if (hash !== hash3) throw new Error()
			await fresh.put(url, response)
			if (url === "/scripts/dependencies.js") copyJSPM = false
			if (url === "/dependencies.js") copyJSPM = false
			if (url === "/dependencies.css") copyFonts = false
		}
		
		if (copyJSPM || copyFonts)
		{
			for (let request of await stale.keys())
			{
				let response = await stale.match(request)
				let {url} = request
				if (copyJSPM && "https://jspm.dev" === new URL(url).origin)
					await fresh.put(url, response)
				if (copyFonts && ["https://fonts.googleapis.com", "https://fonts.gstatic.com"].includes(new URL(url).origin))
					await fresh.put(url, response)
			}
		}
		
		await fresh.put("/hashes.json", response)
		currentCacheName = freshName
		await stale.delete("/hashes.json")
	}
	catch (error)
	{
		await caches.delete(freshName)
	}
	finally
	{
		revalidating = null
		resolve()
	}
}

let respond = (request, waitUntil) =>
{
	if (request.method !== "GET") return fetch(request)
	
	let {origin, pathname} = new URL(request.url)
	
	if (origin === "https://jspm.dev" || origin === "https://fonts.googleapis.com" || origin === "https://fonts.gstatic.com")
		return cacheFirst(request, waitUntil)
	if (origin !== location.origin)
		return fetch(request)
	return staleWhileRevalidate(request, waitUntil)
}

addEventListener("fetch", event => event.respondWith(respond(event.request, p => event.waitUntil(p))))

let receiveMessage = async ({data, source}) =>
{
	let resolve
	let promise = new Promise(f => resolve = f)
	let message
	try
	{
		await revalidating
		
		await cacheNameReady()
		let cacheName = currentCacheName
		
		await prepareDB()
		
		changingAvailability.add(promise)
		
		let cache = await caches.open(cacheName)
		
		let pathname = new URL(source.url).pathname.replace(/\/index\.html$/, "/")
		
		let response
		
		if (data === true)
			response = await cache.match(pathname)
		else
			response = new Response(data, {headers: {"content-type": "text/html"}})
		
		let hashesResponse = await cache.match("/hashes.json")
		if (!hashesResponse) return
		
		let hashes = await hashesResponse.json()
		let {hash} = hashes[pathname]||{}
		
		if (!response || !response.ok || hash !== await computeHash(await response.clone().arrayBuffer()))
		{
			response = await fetch(pathname)
			if (!response.ok || hash !== await computeHash(await response.clone().arrayBuffer()))
				return
		}
		
		let name = pathname.match(/^\/?([^]*?)\/?$/)[1]
		
		if (data === true)
		{
			let request = db
				.transaction("offline-pages", "readwrite")
				.objectStore("offline-pages")
				.get(name)
			
			await new Promise((resolve, reject) => { request.addEventListener("success", resolve) ; request.addEventListener("error", reject) })
			
			let {result} = request
			if (result === undefined)
				result = true
			
			message = {result, buffer: await response.clone().arrayBuffer()}
		}
		else
		{
			message = await response.clone().arrayBuffer()
		}
		
		if (data) await cache.put(pathname, response)
		else await cache.delete(pathname)
		
		let request = db
			.transaction("offline-pages", "readwrite")
			.objectStore("offline-pages")
			.put(Boolean(data), name)
		
		await new Promise((resolve, reject) => { request.addEventListener("success", resolve) ; request.addEventListener("error", reject) })
	}
	finally
	{
		source.postMessage(message)
		changingAvailability.delete(promise)
		resolve()
	}
}

addEventListener("message", event => event.waitUntil(receiveMessage(event)))
