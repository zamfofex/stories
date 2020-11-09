for (let button of document.querySelectorAll("form[action] button"))
{
	let offline = () => { button.disabled = true ; button.title = "unavailable offline" ; button.classList.add("disabled") }
	addEventListener("offline", offline)
	addEventListener("online", () => { button.disabled = false ; button.removeAttribute("title") ; button.classList.remove("disabled") })
	if (!navigator.onLine) offline()
}

for (let a of document.querySelectorAll(`a[target="_blank"], .subscribe a`))
{
	if (a.origin !== location.origin) continue
	
	let title = a.getAttribute("title")
	
	let resetTitle
	if (title) resetTitle = () => { a.setAttribute("title", title) }
	else resetTitle = () => { a.removeAttribute("title") }
	
	let href = a.getAttribute("href")
	
	let offline = () => { a.removeAttribute("href") ; a.title = "unavailable offline" ; a.classList.add("disabled") }
	addEventListener("offline", offline)
	addEventListener("online", () => { a.setAttribute("href", href) ; resetTitle() ; a.classList.remove("disabled") })
	if (!navigator.onLine) offline()
}
