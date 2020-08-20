import mongodb from "mongodb"
let {MongoClient} = mongodb
import buildFeedback from "../build/feedback.js"
import https from "https"
import util from "util"
import FormData from "formdata-node"
import crypto from "crypto"

let streamToBuffer = stream => new Promise((resolve, reject) =>
{
	let chunks = []
	stream.on("data", chunk => chunks.push(chunk))
	stream.on("error", reject)
	stream.on("end", () => resolve(Buffer.concat(chunks)))
})

let computeHash = buffer => crypto.createHash("sha256").update(buffer).digest("hex")

let origin = "https://zamstories.neocities.org"

export default async ({query: {name}, body: {message}}, res) =>
{
	if (!message || !name || message.length < 12)
	{
		res.statusCode = 400
		res.end()
		return
	}
	
	let mongo = await MongoClient.connect(process.env.mongo_url, {useUnifiedTopology: true})
	
	let stories = mongo.db(process.env.mongo_database).collection("stories")
	await stories.updateOne({name}, {$push: {feedback: {date: new Date(), message}}})
	
	let story = await stories.findOne({name}, {feedback: true})
	
	await mongo.close()
	
	if (!story)
	{
		res.statusCode = 400
		res.end()
		return
	}
	
	let url = `${origin}/${name}/`
	
	let page = (await streamToBuffer(await new Promise(f => https.get(url, f)))).toString("utf-8")
	
	let feedback = buildFeedback(story.feedback)
	
	let buffer = Buffer.from(page.replace(/<!--#feedback-->[^]*<!--\/#feedback-->/, feedback))
	
	let json = (await streamToBuffer(await new Promise(f => https.get(`${origin}/hashes.json`, f)))).toString("utf-8")
	let hashes = JSON.parse(json)
	
	hashes[`/${name}/`] = computeHash(buffer)
	
	let data = new FormData()
	data.set(`${name}/index.html`, buffer, "index.html")
	data.set("hashes.json", Buffer.from(JSON.strigify(hashes)), "hashes.json")
	
	let {headers, stream} = data
	
	let request = https.request("https://neocities.org/api/upload", {method: "POST", headers: {...headers, authorization: `Bearer ${process.env.neocities_token}`}})
	stream.pipe(request)
	await new Promise(f => request.on("response", f))
	
	res.statusCode = 303
	res.setHeader("location", url)
	res.end()
}
