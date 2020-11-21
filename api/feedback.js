import {MongoClient, createHash} from "./_dependencies.js"
import buildFeedback from "../build/feedback.js"

let decoder = new TextDecoder()
let encoder = new TextEncoder()

let computeHash = buffer =>
{
	let hash = createHash("sha256")
	hash.update(buffer)
	return hash.toString()
}

let origin = "https://zamstories.neocities.org"

export default async request =>
{
	let name = new URL(request.url, "https://aaa").searchParams.get("name")
	let message = new URLSearchParams(decoder.decode(await Deno.readAll(request.body))).get("message")
	
	if (!message || !name || message.length < 12)
	{
		request.respond({status: 400})
		return
	}
	
	let mongo = new MongoClient()
	mongo.connectWithUri(Deno.env.get("mongo_url"))
	
	let stories = mongo.database(Deno.env.get("mongo_database")).collection("stories")
	await stories.updateOne({name}, {$push: {feedback: {date: new Date(), message}}})
	
	let story = await stories.findOne({name}, {feedback: true})
	
	mongo.close()
	
	if (!story)
	{
		request.respond({status: 400})
		return
	}
	
	let location = `${origin}/${name}/`
	
	let page = await (await fetch(location)).text()
	
	let feedback = buildFeedback(story.feedback)
	
	let json = await (await fetch(`${origin}/hashes.json`)).text()
	let hashes = JSON.parse(json)
	
	let updated = page.replace(/<!--#feedback-->[^]*<!--\/#feedback-->/, feedback)
	hashes[`/${name}/`] = computeHash(updated)
	
	let body = new FormData()
	body.set(`${name}/index.html`, new Blob([updated]), "index.html")
	body.set("hashes.json", new Blob([JSON.stringify(hashes)]), "hashes.json")
	
	await fetch("https://neocities.org/api/upload", {body, method: "POST", headers: {authorization: `Bearer ${Deno.env.get("neocities_token")}`}})
	
	request.respond({status: 303, headers: new Headers({location})})
}
