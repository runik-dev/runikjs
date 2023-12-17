![banner](https://github.com/runik-dev/runikjs/raw/main/images/banner.png)

# Runik SDK

Built for Runik API v0.3.2

![Lines of code](https://img.shields.io/tokei/lines/github/runik-dev/runikjs?style=flat-square&color=9360FF&label=lines%20of%20code)
[![Discord](https://img.shields.io/discord/906313801366921286?label=discord&color=9360FF&style=flat-square)](https://discord.gg/fCTGvyNTHG)
[![Downloads](https://img.shields.io/npm/dy/runik?style=flat-square&color=9360FF)](https://www.npmjs.com/package/runik)

# Usage

```ts
import { Client, Users } from 'runik'
const client = new Client()
	.setEndpoint('http://localhost:9000/api/v1')
	.setKey('API_KEY')
const users = new Users(client)

// Get all users
await users.get()

// Create user
await users.signUp(
	'infrared.studio@skiff.com',
	'myPassword',
	'http://localhost:5173/verify'
)

// Login to user
const user = await users.signIn('infrared.studio@skiff.com', 'myPassword', true) // set true to make the session expire

// Get logged in user
await user.get()

// Get user sessions
await user.getSessions()

// Update signed in users email
await user.updateEmail('newemail@example.com', 'http://localhost:5173/verify')

// Update signed in users password
await user.updatePassword('myPassword', 'newPassword')

// Sign out on all devices
await user.deleteSessions('myPassword')

// Sign out of current session
await user.signOut()

// Delete signed in user
await user.delete('myPassword')
```
