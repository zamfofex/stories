// Also load ‘dependencies.js’ so dependencies can be cached from the list page.
if (navigator.serviceWorker) navigator.serviceWorker.register("/sw.js").then(Function(`import("./dependencies.js")`))
