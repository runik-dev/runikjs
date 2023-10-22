import { request } from 'undici'
import type { User as _User } from 'src/types/user.js'
class User {
	private session: string
	private endpoint: string
	constructor(session: string, endpoint: string) {
		this.session = session
		this.endpoint = endpoint
	}
	async get() {
		const { body, statusCode } = await request(`${this.endpoint}/users/me`, {
			headers: {
				Authorization: this.session
			}
		})
		const json = await body.json()
		if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
		return json as _User
	}
	async delete(password: string) {
		const { body, statusCode } = await request(`${this.endpoint}/users/me`, {
			headers: {
				Authorization: this.session,
				'Content-type': 'application/json'
			},
			method: 'DELETE',
			body: JSON.stringify({ password })
		})
		if (statusCode !== 204) {
			const json = await body.json()
			throw new Error(`Runik: ${JSON.stringify(json)}`)
		}
	}
	async signOut() {
		const { body, statusCode } = await request(
			`${this.endpoint}/users/sessions/${this.session}`,
			{
				method: 'DELETE'
			}
		)
		const json = await body.json()
		if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
	}
	async getSessions() {
		const { body, statusCode } = await request(
			`${this.endpoint}/users/sessions`,
			{
				headers: {
					Authorization: this.session
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
	}
	async deleteSessions(password: string) {
		const { body, statusCode } = await request(
			`${this.endpoint}/users/sessions/`,
			{
				method: 'DELETE',
				headers: {
					Authorization: this.session,
					'Content-type': 'application/json'
				},
				body: JSON.stringify({ password })
			}
		)
		const json = await body.json()
		if (statusCode !== 200) throw new Error(`Runik: ${JSON.stringify(json)}`)
		return json
	}
	async updateEmail(email: string, url: string) {
		const { body, statusCode } = await request(
			`${this.endpoint}/users/me/email`,
			{
				headers: {
					Authorization: this.session,
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
	}
	async updatePassword(oldPassword: string, newPassword: string) {
		const { body, statusCode } = await request(
			`${this.endpoint}/users/me/email`,
			{
				headers: {
					Authorization: this.session,
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
export default User
