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
	
	for (let url of essential) cache.put(url, await fetch(url, {redirect: "manual"}))
	
	let feed = await (await fetch("feed.json")).json()
	
	for (let {url} of feed.items)
	{
		let {pathname} = new URL(url)
		cache.put(pathname, await fetch(pathname, {redirect: "manual"}))
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
	response = await fetch(request, {redirect: "manual"})
	await cache.put(request.url, response.clone())
	return response
}

let networkOnly = request => fetch(request, {redirect: "manual"})

let staleWhileRevalidate = async request =>
{
	let cache = await caches.open(cacheName)
	
	let refresh = async () =>
	{
		let response = await fetch(request, {redirect: "manual"})
		
		if (response.ok) await cache.put(request.url, response.clone())
		
		return response
	}
	
	let response = await cache.match(new URL(request.url).pathname)
	
	if (!response) response = await refresh()
	else refresh()
	
	return response
}

let strategy = ({origin, pathname}) =>
{
	if (origin === "https://jspm.dev" || origin === "https://fonts.googleapis.com")
		return "cache-first"
	if (origin !== location.origin) return "network-only"
	if (pathname === "/style.css"|| pathname === "/script.js" || pathname.startsWith("/scripts/") || pathname === "/" || /^\/.*\//.test(pathname))
		return "stale-while-revalidate"
	
	return "network-only"
}

let respond = ({request}) =>
{
	let url = new URL(request.url)
	if (origin === location.origin) url.pathname = url.pathname.replace(/\/index\.html$/, "/")
	
	switch (strategy(url))
	{
		case "cache-first": return cacheFirst(request)
		case "network-only": return networkOnly(request)
		case "stale-while-revalidate": return staleWhileRevalidate(request)
	}
}

addEventListener("fetch", event => event.respondWith(respond(event)))
