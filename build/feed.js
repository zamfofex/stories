let decoder = new TextDecoder()

let origin = Deno.env.get("neocities_origin")

export default async items =>
{
	let buffer = await Deno.readFile("build/feed/main.txt")
	let itemBuffer = await Deno.readFile("build/feed/item.txt")
	
	let text = decoder.decode(buffer)
	let itemText = decoder.decode(itemBuffer)
	
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
	
	return text.replace(/\(\(\origin\)\)/g, origin).replace("((items))", itemTexts.join(",\n\t\t"))
}
