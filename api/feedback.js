let decoder = new TextDecoder()
let encoder = new TextEncoder()

let origin = Deno.env.get("neocities_origin")
let authorization = `Bearer ${Deno.env.get("neocities_token")}`

export default async request =>
{
	let time = Date.now()
	
	let name = new URL(request.url, "https://aaa").searchParams.get("name")
	let message = new URLSearchParams(decoder.decode(await Deno.readAll(request.body))).get("message")
	
	if (!message || !name || message.length < 12)
	{
		request.respond({status: 400})
		return
	}
	
	let path = `.stories/${name}`
	
	let url = new URL("https://neocities.org/api/list")
	url.searchParams.set("path", path)
	
	let response = await fetch(url, {headers: {authorization: `Bearer ${token}`}})
	if (!response)
	{
		request.respond({status: 400})
		return
	}
	let {files} = await response.json()
	if (!files || !files.length)
	{
		request.respond({status: 400})
		return
	}
	
	let body = new FormData()
	body.set(`.stories/${name}/feedback/${time}.md`, new Blob([message]), `${time}.md`)
	
	await fetch("https://neocities.org/api/upload", {body, method: "POST", headers: {authorization}})
	
	let index = `${path}/feedback/index.txt`
	let feedback = (await fetch(new URL(index, origin))).text() + `${time}\n`
	
	let body2 = new FormData()
	body2.set(index, new Blob([index]), "index.txt")
	await fetch("https://neocities.org/api/upload", {body: body2, method: "POST", headers: {authorization}})
	
	request.respond({status: 303, headers: new Headers({location})})
}
