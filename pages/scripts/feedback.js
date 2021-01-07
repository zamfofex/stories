import formatDate from "./dates.js"
import {micromark} from "./dependencies.js"

let name = location.pathname.match(/^\/?([^]*?)\/?$/)[1]

let feedback = document.querySelector("#feedback")

let main = async () =>
{
	let index = await fetch(`/.stories/${name}/feedback/index.txt`)
	for (let time of (await index.text()).split(/\n/g))
	{
		if (!time) continue
		
		let p = document.createElement("p")
		p.append("on ", formatDate(new Date(Number(time))), ", someone said:")
		let header = document.createElement("header")
		header.append(p)
		
		let response = await fetch(`/.stories/${name}/feedback/${time}.md`)
		if (!response.ok) throw new Error()
		let markdown = await response.text()
		
		let article = document.createElement("article")
		article.append(header)
		article.insertAdjacentHTML("beforeend", micromark(markdown))
		
		feedback.append(article)
		
		let responseResponse = await fetch(`/.stories/${name}/feedback/${time}-response.md`)
		if (!responseResponse.ok) continue
		let responseMarkdown = await responseResponse.text()
		
		let responseP = document.createElement("p")
		responseP.append("response from the author:")
		let responseHeader = document.createElement("header")
		responseHeader.append(responseP)
		
		let responseArticle = document.createElement("article")
		responseArticle.classList.add("response")
		responseArticle.append(responseHeader)
		responseArticle.insertAdjacentHTML("beforeend", micromark(responseMarkdown))
		
		feedback.append(responseArticle)
	}
}

main()
