// Also load ‘dependencies.js’ so it can be cached from the list page.
navigator.serviceWorker.register("/sw.js").then(() => import("./dependencies.js"))
