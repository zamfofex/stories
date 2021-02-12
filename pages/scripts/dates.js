let months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

export default date =>
{
	let result = document.createElement("time")
	let title = ""
	
	let add = (result_, title_ = result_) => { result.append(result_) ; title += title_ }
	
	switch (date.getUTCDay())
	{
		case 0: add("sunday") ; break
		case 1: add("monday") ; break
		case 2: add("tuesday") ; break
		case 3: add("wednesday") ; break
		case 4: add("thursday") ; break
		case 5: add("friday") ; break
		case 6: add("saturday") ; break
	}
	
	add(", the ")
	
	let day = date.getUTCDate()
	
	let ord
	switch (day % 10)
	{
		case 1: ord = "st" ; break
		case 2: ord = "nd" ; break
		case 3: ord = "rd" ; break
		default: ord = "th" ; break
	}
	if (day >= 11 && day <= 13) ord = "th"
	
	let sup = document.createElement("sup")
	add(day)
	result.append(sup)
	sup.append(ord)
	title += ord
	
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
	result.dateTime = date.toISOString()
	
	return result
}
