let old = []

let cacheName = "v1"

let essential =
[
	"/",
	"/style.css",
	"/script.js",
	"/scripts/settings.js",
	"/scripts/capitalization.js",
	"/scripts/themes.js",
	"/scripts/typesetting.js",
	"/scripts/guide-rulers.js",
	"/scripts/register-sw.js",
	"/scripts/dependencies.js",
]

let main = async () =>
{
	for (let name of old) caches.delete(name)
	
	let cache = await caches.open(cacheName)
	
	for (let url of essential)
	{
		let response = await fetch(url)
		if (response.ok) cache.put(url, response)
	}
	
	skipWaiting()
}

addEventListener("install", event => event.waitUntil(main()))
addEventListener("activate", event => event.waitUntil(clients.claim()))

let cacheFirst = async request =>
{
	let cache = await caches.open(cacheName)
	let response = await cache.match(request.url)
	if (response) return response
	response = await fetch(request)
	if (response.ok) await cache.put(request.url, response.clone())
	return response
}

let networkOnly = request => fetch(request)

let staleWhileRevalidate = async (request, cachedOnly) =>
{
	// Currently, this is only used for same‐origin requests (which is assumed by parts of it).
	
	let cache = await caches.open(cacheName)
	
	let pathname = new URL(request.url).pathname.replace(/\/index\.html$/, "/")
	
	let refresh = async () =>
	{
		let response = await fetch(request)
		if (!cachedOnly && response.ok) await cache.put(pathname, response.clone())
		return response
	}
	
	let response = await cache.match(pathname)
	
	if (!response) response = await refresh()
	else if (!cachedOnly) refresh()
	
	return response
}

let strategy = ({origin, pathname}) =>
{
	if (origin === "https://jspm.dev" || origin === "https://fonts.googleapis.com" || origin === "https://fonts.gstatic.com")
		return "cache-first"
	if (origin !== location.origin)
		return "network-only"
	if (pathname === "/style.css"|| pathname === "/script.js" || pathname.startsWith("/scripts/") || pathname === "/")
		return "stale-while-revalidate"
	if (pathname.match(/^\/.+\//))
		return "stale-while-revalidate-if-cached"
	
	return "network-only"
}

let respond = ({request}) =>
{
	if (request.method !== "GET") return networkOnly(request)
	
	switch (strategy(new URL(request.url)))
	{
		case "cache-first": return cacheFirst(request)
		case "network-only": return networkOnly(request)
		case "stale-while-revalidate": return staleWhileRevalidate(request)
		case "stale-while-revalidate-if-cached": return staleWhileRevalidate(request, true)
	}
}

addEventListener("fetch", event => event.respondWith(respond(event)))
