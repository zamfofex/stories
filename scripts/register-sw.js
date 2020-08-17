if (navigator.serviceWorker)
{
	navigator.serviceWorker.register("/sw.js")
	// Also load ‘dependencies.js’ so it can be cached from the list page.
	import("./dependencies.js")
}
