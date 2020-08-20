let request = indexedDB.open("cache")

request.addEventListener("upgradeneeded", () =>
{
	let db = request.result
	db.createObjectStore("offline-pages")
})

export default request
