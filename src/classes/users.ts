import { request } from 'undici'
import Client from './client.js'
import { z } from 'zod'
import User from './user.js'
import type { User as _User } from '../types/user.js'
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
	async signUp(email: string, password: string, verifyUrl: string) {
		const { body } = await request(`${this.endpoint}/users`, {
			method: 'POST',
			headers: {
				Authorization: this.key,
				'Content-type': 'application/json'
			},
			body: JSON.stringify({
				email,
				password,
				verifyUrl
			})
		})
		const json = (await body.json()) as Record<string, string>
		if (json.code) throw new Error(json.code)
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
		return new User(json.token, this.endpoint)
	}
	client = {
		get: async (session: string) => {
			const { body, statusCode } = await request(`${this.endpoint}/users/me`, {
				headers: {
					Authorization: session
				}
			})
			const json = await body.json()
			if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
			return json as _User
		},

		_delete: async (password: string, session: string) => {
			const { body, statusCode } = await request(`${this.endpoint}/users/me`, {
				headers: {
					Authorization: session,
					'Content-type': 'application/json'
				},
				method: 'DELETE',
				body: JSON.stringify({ password })
			})
			if (statusCode !== 204) {
				const json = await body.json()
				throw new Error(`Runik: ${JSON.stringify(json)}`)
			}
		},
		signOut: async (session: string) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/users/sessions/${session}`,
				{
					method: 'DELETE'
				}
			)
			const json = await body.json()
			if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
		},
		getSessions: async (session: string) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/users/sessions`,
				{
					headers: {
						Authorization: session
					}
				}
			)
			const json = await body.json()
			if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
			if (
				!Array.isArray(json) &&
				!(json as string[]).every((v) => typeof v === 'string')
			)
				throw new Error('Runik: Unexpected body')
			return json as string[]
		},
		deleteSessions: async (password: string, session: string) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/users/sessions/`,
				{
					method: 'DELETE',
					headers: {
						Authorization: session,
						'Content-type': 'application/json'
					},
					body: JSON.stringify({ password })
				}
			)
			const json = await body.json()
			if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
			return json
		},
		updateEmail: async (email: string, url: string, session: string) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/users/me/email`,
				{
					headers: {
						Authorization: session,
						'Content-type': 'application/json'
					},
					method: 'PUT',
					body: JSON.stringify({ email, url })
				}
			)
			if (statusCode !== 204) {
				const json = await body.json()
				throw new Error(`Runik: ${JSON.stringify(json)}`)
			}
		},
		updatePassword: async (
			oldPassword: string,
			newPassword: string,
			session: string
		) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/users/me/email`,
				{
					headers: {
						Authorization: session,
						'Content-type': 'application/json'
					},
					method: 'PUT',
					body: JSON.stringify({ oldPassword, newPassword })
				}
			)
			if (statusCode !== 204) {
				const json = await body.json()
				throw new Error(`Runik: ${JSON.stringify(json)}`)
			}
		}
	}
}

export default Users
