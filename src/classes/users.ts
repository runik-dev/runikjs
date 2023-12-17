import { request } from 'undici'
import Client from './client.js'
import { z } from 'zod'
import User from './user.js'
import { Base64 } from 'js-base64'
import type { User as _User } from '../types/user.js'
import type { Project } from '../types/project.js'

const Url = z.string().url()
class Users {
	endpoint: string
	private key: string
	constructor(client: Client) {
		const validUrl = Url.safeParse(client.endpoint)
		if (!validUrl.success)
			throw { code: 'invalid_input', errors: validUrl.error.issues }
		const validKey = z.string().safeParse(client.key)
		if (!validKey.success)
			throw { code: 'invalid_input', errors: validKey.error.issues }
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
	projects = {
		createRepo: async (session: string, name: string) => {
			const valid = z.string().min(4).max(64).safeParse(name)
			if (!valid.success)
				throw { code: 'invalid_input', errors: valid.error.issues }
			const { body, statusCode } = await request(`${this.endpoint}/projects`, {
				headers: {
					Authorization: session,
					'Content-type': 'application/json'
				},
				body: JSON.stringify({ name }),
				method: 'POST'
			})
			const json = await body.json()
			if (statusCode !== 201)
				throw { code: 'runik', body: json, status: statusCode }
			return json as { id: string }
		},
		updateContent: async (
			session: string,
			project_id: string,
			files: Record<string, string>,
			remove: string[]
		) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/projects/files`,
				{
					headers: {
						Authorization: session,
						'Content-type': 'application/json'
					},
					body: JSON.stringify({ project_id, files, delete: remove }),
					method: 'PATCH'
				}
			)
			if (statusCode !== 200 && statusCode !== 204)
				throw { code: 'runik', body: await body.text(), status: statusCode }
		},
		list: async (session: string) => {
			const { body, statusCode } = await request(`${this.endpoint}/projects`, {
				headers: {
					Authorization: session
				}
			})
			const json = await body.json()
			if (statusCode !== 200)
				throw { code: 'runik', body: json, status: statusCode }
			return json as Project[]
		},
		get: async (session: string, project_id: string) => {
			const { body, statusCode } = await request(
				`${this.endpoint}/projects/${project_id}`,
				{
					headers: {
						Authorization: session
					}
				}
			)
			const json = await body.json()
			if (statusCode !== 200)
				throw { code: 'runik', body: json, status: statusCode }
			return json as Project[]
		}
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
	async verifyEmail(token: string) {
		const { body, statusCode } = await request(
			`${this.endpoint}/users/verify/${token}`,
			{
				method: 'PUT'
			}
		)
		if (statusCode !== 204) {
			const json = await body.json()
			throw { code: 'runik', body: json, status: statusCode }
		}
	}
}

export default Users
