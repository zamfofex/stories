import {subscribe} from "./messages.js"

subscribe("theme", theme => document.documentElement.dataset.theme = theme)

if (CSS.registerProperty)
{
	CSS.registerProperty({name: "--text-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
	CSS.registerProperty({name: "--background-color", syntax: "<color>", inherits: true, initialValue: "#0000"})
}
