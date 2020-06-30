let settings =
[
	"capitalization",
	"guide-rulers",
	"typesetting",
	"optical-alignment",
	"hyphenation",
	"theme",
]

export default async ({body}, res) =>
{
	let cookies = []
	for (let setting of settings) cookies.push(`${setting}=${body[setting]||"off"};Max-Age=2592000`)
	
	res.statusCode = 303
	res.setHeader("location", `/${body.name}`)
	res.setHeader("set-cookie", cookies)
	res.end()
}
