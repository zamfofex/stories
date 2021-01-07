let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default date =>
{
	let result = document.createElement("time")
	let title = ""
	
	let add = (result_, title_ = result_) => { result.append(result_) ; title += title_ }
	
	switch (date.getUTCDay())
	{
		case 0: add("Sunday") ; break
		case 1: add("Monday") ; break
		case 2: add("Tuesday") ; break
		case 3: add("Wednesday") ; break
		case 4: add("Thursday") ; break
		case 5: add("Friday") ; break
		case 6: add("Saturday") ; break
	}
	
	add(", the ")
	
	let day = date.getUTCDate()
	
	let sup = document.createElement("sup")
	let ord
	switch (day)
	{
		case 1: add("first") ; break
		case 2: add("second") ; break
		case 3: add("third") ; break
		case 4: add("fourth") ; break
		case 5: add("fifth") ; break
		case 6: add("sixth") ; break
		case 7: add("seventh") ; break
		case 8: add("eighth") ; break
		case 9: add("ninth") ; break
		case 10: add("tenth") ; break
		case 11: add("eleventh") ; break
		case 12: add("twelfth") ; break
		case 13: add("thirteenth") ; break
		case 14: add("fourteenth") ; break
		case 15: add("fifteenth") ; break
		case 16: add("sixteenth") ; break
		case 17: add("seventeenth") ; break
		case 18: add("eighteenth") ; break
		case 19: add("nineteenth") ; break
		case 20: add("twentieth") ; break
		case 30: add("thirtieth") ; break
		default:
			add(day)
			result.append(sup)
			switch (day % 10)
			{
				case 1: ord = "st" ; break
				case 2: ord = "nd" ; break
				case 3: ord = "rd" ; break
				default: ord = "th" ; break
			}
			sup.append(ord)
			title += ord
			break
	}
	
	add(" of ")
	add(months[date.getUTCMonth()])
	add(" of " + date.getUTCFullYear())
	
	title += " at "
	
	let hours = date.getUTCHours()
	title += hours.toString().padStart(2, "0") + ":"
	title += date.getUTCMinutes().toString().padStart(2, "0") + " "
	if (0 < hours && hours < 12) title += "a.m. (UTC)"
	else if (hours === 12) title += "p.m. (UTC)"
	else title += "UTC"
	
	result.title = title
	
	return result
}
