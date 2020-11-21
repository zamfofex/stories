import {micromark} from "./dependencies.js"
import formatDate from "./dates.js"

export default feedback =>
{
	let result = ""
	for (let {message, response, date} of feedback)
	{
		result += `<article><header><p>on `
		result += formatDate(date)
		result += `, someone said:</p></header>`
		
		result += micromark(message)
		
		result += `</article>`
		
		if (response)
		{
			result += `<article class="response"><header><p>response from the author:</p></header>`
			result += micromark(response)
			result += `</article>`
		}
	}
	return `<!--#feedback-->${result}<!--/#feedback-->`
}
