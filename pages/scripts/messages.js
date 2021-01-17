let subscriptions = {}

export let subscribe = (name, subscription) =>
{
	let set = subscriptions[name]
	if (!set)
		set = new Set(),
		subscriptions[name] = set
	set.add(subscription)
}

export let unsubscribe = (name, subscription) =>
{
	let set = subscriptions[name]
	if (!set) return
	set.delete(subscription)
}

export let dispatch = (name, data) =>
{
	let set = subscriptions[name]
	if (!set) return
	for (let subscription of set)
		subscription(data)
}
