import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

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

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000)
  return otp.toString()
}

app.post('/users', async (req, res) => {
  const { username, password } = req.body

  if (typeof username !== 'string' || password.length < 8) {
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

    const userId = user.id
    const otp = generateOTP()

    await query(
      'INSERT INTO sessions (userId, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?',
      [userId, otp, otp],
    )

    return res.json({ token: otp })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte logga in' })
  }
})

app.post('/me/accounts', async (req, res) => {
  const { token } = req.body

  try {
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE token = ?',
      [token],
    )

    if (sessionResult.length === 0) {
      return res.status(401).json({ error: 'Ogiltig token' })
    }

    const userId = sessionResult[0].userId
    const accountResult = await query(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId],
    )

    if (accountResult.length === 0) {
      return res.status(401).json({ error: 'Inget konto hittades' })
    }

    return res.json({ amount: accountResult[0].amount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte hämta saldo' })
  }
})

app.post('/me/accounts/transactions', async (req, res) => {
  const { token, amount, note } = req.body

  try {
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE token = ?',
      [token],
    )

    if (sessionResult.length === 0) {
      return res.status(401).json({ error: 'Ogiltig token' })
    }

    const userId = sessionResult[0].userId

    const accountResult = await query(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId],
    )

    if (accountResult.length === 0) {
      return res.status(401).json({ error: 'Inget konto hittades' })
    }

    const accountId = accountResult[0].id

    await query('UPDATE accounts SET amount = amount + ? WHERE userId = ?', [
      Number(amount),
      userId,
    ])

    await query(
      'INSERT INTO transactions (accountId, amount, note) VALUES (?, ?, ?)',
      [accountId, Number(amount), note || null],
    )

    const updatedAccount = await query(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId],
    )

    return res.json({ amount: updatedAccount[0].amount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte genomföra insättningen' })
  }
})

app.post('/me/accounts/transactions/history', async (req, res) => {
  const { token } = req.body

  try {
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE token = ?',
      [token],
    )

    if (sessionResult.length === 0) {
      return res.status(401).json({ error: 'Ogiltig token' })
    }

    const userId = sessionResult[0].userId

    const accountResult = await query(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId],
    )

    if (accountResult.length === 0) {
      return res.status(401).json({ error: 'Inget konto hittades' })
    }

    const accountId = accountResult[0].id

    const transactions = await query(
      'SELECT amount, note, createdAt FROM transactions WHERE accountId = ? ORDER BY createdAt DESC',
      [accountId],
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
