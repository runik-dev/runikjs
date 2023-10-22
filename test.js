import dotenv from 'dotenv'
dotenv.config()
import { Client, Users } from './dist/index.js'
import crypto from 'crypto'

const runallStart = new Date()
const client = new Client()
	.setEndpoint(process.env.ENDPOINT)
	.setKey(process.env.KEY)
const users = new Users(client)
const email = process.env.TEST_EMAIL ?? 'infrared.studio@skiff.com'
const password = crypto.randomBytes(10).toString('hex')

const createStart = new Date()
const { id } = await users.signUp(email, password, 'http://localhost:5173')
const createEnd = new Date()
console.log(id)

const getAllStart = new Date()
console.log(await users.get())
const getAllEnd = new Date()

const signInStart = new Date()
const user = await users.signIn(email, password, true)
const signInEnd = new Date()

const getMeStart = new Date()
console.log(await user.get())
const getMeEnd = new Date()

const getSessionsStart = new Date()
console.log(await user.getSessions())
const getSessionsEnd = new Date()

const deleteMeStart = new Date()
await user.delete(password)
const deleteMeEnd = new Date()

const signOutStart = new Date()
await user.signOut()
const signOutEnd = new Date()

const runAllEnd = new Date()

console.log(`Total: ${runAllEnd - runallStart}ms`)
console.log(`Create user: ${createEnd - createStart}ms`)
console.log(`Get all users: ${getAllEnd - getAllStart}ms`)
console.log(`Sign in: ${signInEnd - signInStart}ms`)
console.log(`Get me: ${getMeEnd - getMeStart}ms`)
console.log(`Get sessions: ${getSessionsEnd - getSessionsStart}ms`)
console.log(`Delete me: ${deleteMeEnd - deleteMeStart}ms`)
console.log(`Sign Out: ${signOutEnd - signOutStart}ms`)
