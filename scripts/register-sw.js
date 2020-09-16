import "./indexed-db.js"
// Also load ‘dependencies.js’ so dependencies can be cached from the list page.
navigator.serviceWorker.register("/sw.js").then(Function(`import("./dependencies.js")`))
