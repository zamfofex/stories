import "./indexed-db.js"
// Also load ‘dependencies.js’ so dependencies can be cached from the list page.
navigator.serviceWorker.register("/sw.js", {type: "module"}).then(() => import("./dependencies.js"))
