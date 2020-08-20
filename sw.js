let db
let prepareDB = async () =>
{
	let request = indexedDB.open("cache")
	await new Promise((resolve, reject) => { request.addEventListener("success", resolve) ; request.addEventListener("error", reject) })
	db = request.result
}

let currentCacheName

let cacheNameReady = (async () =>
{
	for (let name of await caches.keys())
	{
		if (!currentCacheName && await (await caches.open(name)).match("/hashes.json")) currentCacheName = name
		else await caches.delete(name)
	}
	if (!currentCacheName) currentCacheName = String(Date.now())
})()

let computeHash = async buffer =>
{
	let array = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))]
	return array.map(byte => byte.toString(0x10).padStart(2, "0")).join("")
}

let main = async () =>
{
	try
	{
		await cacheNameReady
		let cacheName = currentCacheName
		
		let cache = await caches.open(cacheName)
		
		if (await cache.match("/hashes.json")) return
		
		let response = await fetch("/hashes.json")
		if (!response.ok) throw new Error()
		
		await cache.put("/hashes.json", response.clone())
		
		let hashes = await response.json()
		
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
		
		skipWaiting()
	}
	catch (error)
	{
		for (let name of await caches.keys()) await caches.delete(name)
		throw error
	}
}

addEventListener("install", event => event.waitUntil(main()))
addEventListener("activate", event => event.waitUntil(clients.claim()))

let cacheFirst = async (request, waitUntil) =>
{
	await cacheNameReady
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
	await cacheNameReady
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
		let hashes = await hashesResponse.json()
		let {hash} = hashes[pathname]||{}
		
		let response = await fetch(request)
		
		if (hash && response.ok)
		{
			let hash2 = await computeHash(await response.clone().arrayBuffer())
			if (hash !== hash2) await revalidate()
		}
		
		return response
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

let revalidating = false

let revalidate = async () =>
{
	if (revalidating) return
	await cacheNameReady
	let cacheName = currentCacheName
	let freshName = String(Date.now())
	revalidating = true
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
			if (url === "/dependencies.css") copyFonts = false
		}
		
		if (copyJSPM || copyFonts)
		{
			for (let response of await stale.matchAll())
			{
				if (copyJSPM && "https://jspm.dev" === new URL(response.url).origin)
					await fresh.put(response.url, response)
				if (copyFonts && ["https://fonts.googleapis.com", "https://fonts.gstatic.com"].includes(new URL(response.url).origin))
					await fresh.put(response.url, response)
			}
		}
		
		await fresh.put("/hashes.json", response)
		stale.delete("/hashes.json")
	}
	catch (error)
	{
		await caches.delete(freshName)
		throw error
	}
	finally
	{
		revalidating = false
	}
	
	currentCacheName = freshName
}

let respond = (request, waitUntil) =>
{
	if (request.method !== "GET") return fetch(request)
	
	let {origin, pathname} = new URL(request.url)
	
	if (origin === "https://jspm.dev" || origin === "https://fonts.googleapis.com" || origin === "https://fonts.gstatic.com")
		return cacheFirst(request, waitUntil)
	if (origin !== location.origin)
		return fetch(request)
	if (pathname === "/style.css"|| pathname === "/script.js" || pathname.match(/^\/.+\//) || pathname === "/")
		return staleWhileRevalidate(request, waitUntil)
	
	return fetch(request)
}

addEventListener("fetch", event => event.respondWith(respond(event.request, p => event.waitUntil(p))))

let toggleOfflineAvailability = async ({name, available}) =>
{
	await cacheNameReady
	let cacheName = currentCacheName
	
	let cache = await caches.open(cacheName)
	
	let url = "/" + name + "/"
	if (available) cache.put(url, await respond(new Request(url)))
	else cache.delete(url)
}

addEventListener("message", event => event.waitUntil(toggleOfflineAvailability(event.data)))
