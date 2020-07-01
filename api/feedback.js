import mongodb from "mongodb"
let {MongoClient} = mongodb
import buildFeedback from "../build/feedback.js"
import https from "https"
import util from "util"
import FormData from "formdata-node"

let streamToBuffer = stream => new Promise((resolve, reject) =>
{
	let chunks = []
	stream.on("data", chunk => chunks.push(chunk))
	stream.on("error", reject)
	stream.on("end", () => resolve(Buffer.concat(chunks)))
})

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
	
	let url = `https://zamstories.neocities.org/${name}/`
	
	let page = (await streamToBuffer(await new Promise(f => https.get(url, f)))).toString("utf-8")
	
	let feedback = buildFeedback(story.feedback)
	
	let buffer = Buffer.from(page.replace(/<!--#feedback-->[^]*?<!--\/#feedback-->/, feedback))
	
	let data = new FormData()
	data.set(`${name}/index.html`, buffer, "index.html")
	
	let {headers, stream} = data
	
	let request = https.request("https://neocities.org/api/upload", {auth: process.env.neocities_auth, method: "POST", headers})
	stream.pipe(request)
	await new Promise(f => request.on("response", f))
	
	res.statusCode = 303
	res.setHeader("location", url)
	res.end()
}
