import { request } from 'undici'
import Client from './client.js'
import { z } from 'zod'
import User from './user.js'
import type { User as _User } from '../types/user.js'
import { Base64 } from 'js-base64'

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
				url: verifyUrl
			})
		})
		const json = (await body.json()) as Record<string, string>
		if (json.code) throw { code: json.code, body: json }
		if (!json.id) throw { code: 'runik_unexpected_body', body: json }
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
		if (json.code) throw { code: json.code, body: json }
		if (!json.token) throw { code: 'runik_unexpected_body', body: json }
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
			if (statusCode !== 200)
				throw { code: 'runik', body: json, status: statusCode }
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
				throw { code: 'runik', body: json, status: statusCode }
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
			if (statusCode !== 200)
				throw { code: 'runik', body: json, status: statusCode }
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
			if (statusCode !== 200)
				throw { code: 'runik', body: json, status: statusCode }
			if (
				!Array.isArray(json) &&
				!(json as string[]).every((v) => typeof v === 'string')
			)
				throw { code: 'runik_unexpected_body' }
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
			if (statusCode !== 200)
				throw { code: 'runik', body: json, status: statusCode }
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
				throw { code: 'runik', body: json, status: statusCode }
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
				throw { code: 'runik', body: json, status: statusCode }
			}
		},
		updateAvatar: async (b64: string, session: string) => {
			z.string().refine(Base64.isValid).parse(b64)
			const { body, statusCode } = await request(
				`${this.endpoint}/users/me/avatar`,
				{
					headers: {
						Authorization: session,
						'Content-type': 'application/json'
					},
					method: 'PUT',
					body: JSON.stringify({ image: b64 })
				}
			)
			if (statusCode !== 204) {
				const json = await body.json()
				throw { code: 'runik', body: json, status: statusCode }
			}
		},
		deleteAvatar: async (session: string) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/users/me/avatar`,
				{
					headers: {
						Authorization: session
					},
					method: 'DELETE'
				}
			)
			if (statusCode !== 204) {
				const json = await body.json()
				throw { code: 'runik', body: json, status: statusCode }
			}
		}
	}
}

export default Users
