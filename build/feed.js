import fs from "fs"
let fsp = fs.promises

export default async items =>
{
	let text = await fsp.readFile("build/feed/main.txt", "utf-8")
	let itemText = await fsp.readFile("build/feed/item.txt", "utf-8")
	
	itemText = itemText.replace(/\n*$/, "")
	itemText = itemText.replace(/\n/g, "\n\t\t")
	
	let itemTexts = []
	
	for (let item of items)
	{
		let array = itemText.split((/\(\((.*?)\)\)/g))
		for (let i = 1 ; i < array.length ; i += 2)
			array[i] = JSON.stringify(item[array[i]])
		itemTexts.push(array.join(""))
	}
	
	return text.replace("((items))", itemTexts.join(",\n\t\t"))
}
