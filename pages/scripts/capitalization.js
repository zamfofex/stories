import {subscribe} from "./messages.js"

subscribe("capitalization", enabled => document.body.classList.toggle("capitalization", enabled !== "off"))
