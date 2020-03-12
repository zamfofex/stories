let cacheTime = {}
let cache = {}

export default async (file, process, name) =>
{
	if (!name) name = file.metadata.name
	
	let cached = cache[name]
	if (cached)
	{
		let now = Date.now()
		let time = cacheTime[name]
		
		if (now - time < 300000)
			return cached
		
		let {updated} = file.metadata
		
		if (new Date(updated).getTime() < cacheTime[name])
			return cached
	}
	
	if (!(await file.exists())[0])
	{
		cache[name] = null
		cacheTime[name] = Date.now()
		return null
	}
	
	let result = process((await file.download())[0].toString("utf-8"))
	cache[name] = result
	cacheTime[name] = Date.now()
	return result
}
