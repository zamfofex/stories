import {Storage} from "@google-cloud/storage"
import names from "./names.json"
import util from "util"

let storage = new Storage({credentials: JSON.parse(process.env.google_credentials_json)})

let bucket = storage.bucket(process.env.bucket_name)

export default async ({query: {name}, body: {message}}, res) =>
{
	if (!(names.includes(name) && message))
	{
		res.statusCode = 400
		res.end()
		return
	}
	
	let file = await bucket.file(`/${name}/${Date.now()}.md`).createWriteStream()
	let end = (...args) => file.end(...args)
	await util.promisify(end)(message)
	
	res.statusCode = 303
	res.setHeader("location", `/${name}`);
	
	res.end()
}
