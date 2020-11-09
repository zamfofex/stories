import mailer from "nodemailer"
import md from "commonmark"
import mongodb from "mongodb"
let {MongoClient} = mongodb

let parser = new md.Parser()
let renderer = new md.HtmlRenderer({safe: true})

let style =
	`font-family: 'Lora', serif;` +
	`font-size: 16px;` +
	`background-color: #FFEEDD;` +
	`color: #774411;` +
	`margin: 0;` +
	`padding: 2em;` +
	`line-height: 1.75em;` +
	`text-align: center;`

let message = body =>
	`<!doctype html>\n` +
	`<html>` +
		`<head>` +
			`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@0;1">` +
			`<style>a { color: #774411; text-decoration: underline; }</style>` +
		`</head>` +
		`<body style="${style}">${body}</body>` +
	`</html>\n`

let text = `
	Hello there!
	
	It seems you have decided to subscribe to receive fiction written by me via email!
	
	**If you haven’t**, feel free to safely ignore this email.
	
	If you have, you can confirm your subscription by replying to this email.
	
	― Zamfofex
	
	<https://zamstories.neocities.org>
`.replace(/\t/g, "").replace(/^\n+|\n+$/, "")

let html = message(renderer.render(parser.parse(text)))

let addresses = new Set()

let url = "https://zamstories.neocities.org"

export default async ({body: {email}}, res) =>
{
	if (addresses.has(email))
	{
		await mongo.close()
		res.statusCode = 303
		res.setHeader("location", url)
		res.end()
	}
	
	addresses.add(email)
	
	let mongo = await MongoClient.connect(process.env.mongo_url, {useUnifiedTopology: true})
	
	let emails = mongo.db(process.env.mongo_database).collection("emails")
	
	if (await emails.findOne({email}, {}))
	{
		await mongo.close()
		res.statusCode = 303
		res.setHeader("location", url)
		res.end()
		return
	}
	
	await emails.insertOne({email, date: new Date()})
	
	await mongo.close()
	
	let transport = mailer.createTransport(
	{
		host: "smtp.gmail.com",
		port: 587,
		auth:
		{
			user: process.env.email_username,
			pass: process.env.email_password,
		},
	})
	
	await transport.sendMail(
	{
		from: {name: "Zamfofex", address: process.env.email_address},
		to: {address: email},
		subject: "confirm subscription",
		text, html,
	})
	
	res.statusCode = 303
	res.setHeader("location", url)
	res.end()
}
