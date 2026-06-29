import dotenv from 'dotenv'
import { getPayload } from 'payload'
import readline from 'readline'

dotenv.config({ path: '.vercel/.env.production.local' })
dotenv.config()

function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function passwordQuestion(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

const email = await question('New admin email: ')
const password = await passwordQuestion('New admin password: ')

if (!email.includes('@')) {
  throw new Error('Email does not look valid.')
}

if (password.length < 8) {
  throw new Error('Password must be at least 8 characters.')
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Check .vercel/.env.production.local.')
}

if (!process.env.PAYLOAD_SECRET) {
  throw new Error('PAYLOAD_SECRET is missing. Check .vercel/.env.production.local.')
}

const { default: config } = await import('../src/payload.config.js')
const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  limit: 1,
})

if (existing.docs[0]) {
  await payload.update({
    collection: 'users',
    id: existing.docs[0].id,
    data: {
      email,
      password,
    },
  })
} else {
  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
    },
  })
}

console.log(`Admin login is ready for ${email}.`)
