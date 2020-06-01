import mongodb from "mongodb"
let {MongoClient} = mongodb

export default async ({query: {name}, body: {message}}, res) =>
{
	if (!message || !name || message.length < 12)
	{
		res.statusCode = 400
		res.end()
		return
	}
	
	let mongo = await MongoClient.connect(process.env.mongo_url)
	
	await mongo.db(process.env.mongo_database).collection("stories").updateOne({name}, {$push: {feedback: {date: new Date(), message}}})
	
	await mongo.close()
	
	res.statusCode = 303
	res.setHeader("location", `/${name}`)
	res.end()
}
