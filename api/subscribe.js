import {SmtpClient, MongoClient, micromark} from "./_dependencies.js"

let decoder = new TextDecoder()

let message = body => `
<!doctype html>\n
<html lang="en">
<style>a { color: #774411; text-decoration: underline; }</style>
<body
	style=
	"
		font-family: serif;
		font-size: 16px;
		background-color: #FFEEDD;
		color: #774411;
		margin: 0;
		padding: 2em;
		line-height: 1.75em;
		text-align: center;
	"
>${body}</body>
`

let text = `
	Hello there!
	
	It seems you have decided to subscribe to receive fiction written by me via email!
	
	**If you haven’t**, feel free to safely ignore this email.
	
	If you have, you can confirm your subscription by replying to this email.
	
	― Zamfofex
	
	<https://zamstories.neocities.org>
`.replace(/\t/g, "").replace(/^\n+|\n+$/, "")

let content = message(micromark(text))

let addresses = new Set()

let location = "https://zamstories.neocities.org"

export default async request =>
{
	let email = new URLSearchParams(decoder.decode(await Deno.readAll(request.body))).get("email")
	
	if (/\s/.test(email))
	{
		request.respond({status: 400})
		return
	}
	
	if (addresses.has(email))
	{
		request.respond({status: 303, headers: new Headers({location})})
		return
	}
	
	addresses.add(email)
	
	let mongo = new MongoClient()
	mongo.connectWithUri(Deno.env.get("mongo_url"))
	
	let emails = mongo.database(Deno.env.get("mongo_database")).collection("emails")
	
	if (false && await emails.findOne({email}, {}))
	{
		mongo.close()
		request.respond({status: 303, headers: new Headers({location})})
		return
	}
	
	await emails.insertOne({email, date: new Date()})
	
	mongo.close()
	
	let smtp = new SmtpClient({content_encoding: "8bit"})
	
	await smtp.connectTLS(
	{
		hostname: Deno.env.get("email_host"),
		port: Number(Deno.env.get("email_port")),
		username: Deno.env.get("email_username"),
		password: Deno.env.get("email_password"),
	})
	
	await smtp.send(
	{
		from: `Zamfofex <${Deno.env.get("email_address")}>`,
		to: email,
		subject: "confirm subscription",
		content,
	})
	
	request.respond({status: 303, headers: new Headers({location})})
}
