interface Init {
	endpoint?: string
	key?: string
}
class Client {
	endpoint?: string
	key?: string

	constructor(init?: Init | undefined) {
		this.endpoint ??= init?.endpoint
		this.key ??= init?.key
	}

	setEndpoint(endpoint: string) {
		this.endpoint = endpoint
		return this
	}
	setKey(key: string) {
		this.key = key
		return this
	}
}
export default Client
