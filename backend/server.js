import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validateAmount } from './src/validateAmount.js'

const secret = process.env.JWT_SECRET

if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('JWT_SECRET måste vara minst 32 byte')
}

const app = express()
const port = process.env.PORT || 3001

app.use(bodyParser.json())
app.use(cors())

const pool = mysql.createPool({
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bajenbanken',
  port: process.env.DB_PORT || 3306,
})

async function query(sql, params) {
  const [results] = await pool.execute(sql, params)
  return results
}

function requireAuth(req, res, next) {
  const authHeader = req.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Saknar eller felaktig Authorization-header' })
  }

  const token = authHeader.slice('Bearer '.length).trim()

  if (!token) {
    return res.status(401).json({ error: 'Saknar token' })
  }

  let payload
  try {
    payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'banken',
      audience: 'banken-api',
    })
  } catch {
    return res.status(401).json({ error: 'Ogiltig eller utgången token' })
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof payload.sub !== 'string'
  ) {
    return res.status(401).json({ error: 'Ogiltig eller utgången token' })
  }

  const userId = Number(payload.sub)

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({ error: 'Ogiltig eller utgången token' })
  }

  req.userId = userId
  next()
}

app.post('/users', async (req, res) => {
  const { username, password } = req.body

  if (typeof username !== 'string' || username.trim() === '') {
    return res.status(400).json({ error: 'Användarnamn krävs' })
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res
      .status(400)
      .json({ error: 'Lösenordet måste vara minst 8 tecken' })
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username.trim(), passwordHash],
    )
    const userId = result.insertId

    await query('INSERT INTO accounts (userId, amount) VALUES (?, ?)', [
      userId,
      0,
    ])

    return res.status(201).json({ id: userId, username: username.trim() })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Användarnamnet är redan taget' })
    }
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte skapa användare' })
  }
})

app.post('/sessions', async (req, res) => {
  const { username, password } = req.body

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Fel användarnamn eller lösenord' })
  }

  try {
    const result = await query(
      'SELECT id, password_hash FROM users WHERE username = ?',
      [username.trim()],
    )

    const user = result[0]

    if (!user) {
      return res.status(401).json({ error: 'Fel användarnamn eller lösenord' })
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password_hash)

    if (!passwordIsCorrect) {
      return res.status(401).json({ error: 'Fel användarnamn eller lösenord' })
    }

    const token = jwt.sign({ sub: String(user.id) }, secret, {
      algorithm: 'HS256',
      issuer: 'banken',
      audience: 'banken-api',
      expiresIn: '15m',
    })

    return res.json({ token })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte logga in' })
  }
})

app.post('/me/accounts', requireAuth, async (req, res) => {
  try {
    const accountResult = await query(
      'SELECT amount FROM accounts WHERE userId = ?',
      [req.userId],
    )

    if (accountResult.length === 0) {
      return res.status(404).json({ error: 'Inget konto hittades' })
    }

    return res.json({ amount: accountResult[0].amount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte hämta saldo' })
  }
})

app.post('/me/accounts/transactions', requireAuth, async (req, res) => {
  const { amount, note } = req.body

  if (!validateAmount(amount)) {
    return res.status(400).json({ error: 'Beloppet måste vara större än 0' })
  }

  try {
    const accountResult = await query(
      'SELECT id FROM accounts WHERE userId = ?',
      [req.userId],
    )

    if (accountResult.length === 0) {
      return res.status(404).json({ error: 'Inget konto hittades' })
    }

    const accountId = accountResult[0].id

    await query('UPDATE accounts SET amount = amount + ? WHERE userId = ?', [
      Number(amount),
      req.userId,
    ])

    await query(
      'INSERT INTO transactions (accountId, amount, note) VALUES (?, ?, ?)',
      [accountId, Number(amount), note || null],
    )

    const updatedAccount = await query(
      'SELECT amount FROM accounts WHERE userId = ?',
      [req.userId],
    )

    return res.json({ amount: updatedAccount[0].amount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte genomföra insättningen' })
  }
})

app.post('/me/accounts/transactions/history', requireAuth, async (req, res) => {
  try {
    const accountResult = await query(
      'SELECT id FROM accounts WHERE userId = ?',
      [req.userId],
    )

    if (accountResult.length === 0) {
      return res.status(404).json({ error: 'Inget konto hittades' })
    }

    const transactions = await query(
      'SELECT amount, note, createdAt FROM transactions WHERE accountId = ? ORDER BY createdAt DESC',
      [accountResult[0].id],
    )

    return res.json({ transactions })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte hämta transaktioner' })
  }
})

app.listen(port, () => {
  console.log(`Bankens backend körs på http://127.0.0.1:${port}`)
})
