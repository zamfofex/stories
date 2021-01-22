onload = function ()
{
	var feedback = document.getElementById("feedback")
	
	if (window.HTMLDetailsElement)
	if (feedback instanceof HTMLDetailsElement)
		return
	
	feedback.setAttribute("open", "")
	feedback.className += " no-close"
	
	document.body.removeChild(document.getElementById("display-settings"))
}
