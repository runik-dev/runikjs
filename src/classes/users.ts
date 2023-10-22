import { request } from 'undici'
import Client from './client.js'
import { z } from 'zod'
import User from './user.js'
const Url = z.string().url()
class Users {
	endpoint: string
	private key: string
	constructor(client: Client) {
		Url.parse(client.endpoint)
		z.string().parse(client.key)
		this.endpoint = client.endpoint!
		this.key = client.key!
	}
	async get(): Promise<User[]> {
		const { body } = await request(`${this.endpoint}/users`)
		return (await body.json()) as User[]
	}
	async create(email: string, password: string, url: string) {
		const { body } = await request(`${this.endpoint}/users`, {
			method: 'POST',
			headers: {
				Authorization: this.key,
				'Content-type': 'application/json'
			},
			body: JSON.stringify({
				email,
				password,
				url
			})
		})
		const json = (await body.json()) as Record<string, string>
		if (json.code) throw new Error(json.code + '-' + json.error)
		if (!json.id) throw new Error('Runik: Unexpected body')
		return json as { id: string }
	}
	async signIn(email: string, password: string, expire = false, ip?: string) {
		const { body } = await request(`${this.endpoint}/users/sessions`, {
			method: 'POST',
			headers: {
				Authorization: this.key,
				'Content-type': 'application/json'
			},
			body: JSON.stringify({
				email,
				password,
				expire,
				ip
			})
		})
		const json = (await body.json()) as Record<string, string>
		if (json.code) throw new Error(json.code)
		if (!json.token) throw new Error('Runik: Unexpected body')
		return new User(json.token, this)
	}
}
export default Users
