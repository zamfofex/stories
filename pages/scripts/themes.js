import {subscribe} from "./messages.js"

subscribe("theme", theme => document.documentElement.dataset.theme = theme)
