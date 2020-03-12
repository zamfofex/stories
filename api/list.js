import md from "commonmark"
import download from "./_download.js"
import bucket from "./_bucket.js"

let parser = new md.Parser()
let renderer = new md.HtmlRenderer()

let unindent = async (strings, ...values) =>
	strings.map((string, i) => (i ? values[i - 1] : "") + string.replace(/[\t\n]/g, "")).join("")

let process = async md => unindent`
	<!doctype html>
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<title>zambonifofex’s stories</title>
			<meta name="viewport" content="width=device-width">
			<link rel="stylesheet" href="/style.css">
		</head>
		<body>
			${renderer.render(parser.parse(md))}
		</body>
	</html>
`

export default async (req, res) =>
	res.end((await download(bucket.file("list.md"), process, "list.md")))
