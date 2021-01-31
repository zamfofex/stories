import {subscribe} from "./messages.js"

subscribe("hyphenation", enabled => document.body.classList.toggle("hyphenation", enabled !== "off"))
