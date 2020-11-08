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

export default async ({body: {email}}, res) =>
{
	let mongo = await MongoClient.connect(process.env.mongo_url, {useUnifiedTopology: true})
	
	let sent = mongo.db(process.env.mongo_database).collection("emails")
	
	let base = Date.now() - 600000
	let date = new Date(base)
	let recent = sent.find({date: {$gte: date}}, {date: true}).sort({date: -1})
	
	let count = 0
	
	for await (let {date} of recent)
	{
		count++
		
		let time = Number(date) - base
		
		if (count / time >= 2 / 10000)
		{
			await mongo.close()
			res.statusCode = 400
			res.end()
			return
		}
	}
	
	if (await sent.findOne({email}, {}))
	{
		await mongo.close()
		res.statusCode = 303
		res.setHeader("location", "https://zamstories.neocities.org")
		res.end()
		return
	}
	
	await sent.insertOne({email, date})
	
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
	res.setHeader("location", "https://zamstories.neocities.org")
	res.end()
}
