import {dispatch} from "./messages.js"

addEventListener("pageshow", ({persisted}) =>
{
	if (!persisted) return
	for (let {length} = localStorage, i = 0 ; i < length ; i++)
	{
		let name = localStorage.key(i)
		dispatch(name, localStorage.getItem(name))
	}
})
