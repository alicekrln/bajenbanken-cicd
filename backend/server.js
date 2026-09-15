import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mysql from 'mysql2/promise'

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

app.use(cors())
app.use(bodyParser.json())

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000)
  return otp.toString()
}

app.post('/users', async (req, res) => {
  const { username, password } = req.body

  try {
    const result = await query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password],
    )
    const userId = result.insertId

    await query('INSERT INTO accounts (userId, amount) VALUES (?, ?)', [
      userId,
      0,
    ])
    return res.status(201).json({ id: userId, username })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte skapa användare' })
  }
})

app.post('/sessions', async (req, res) => {
  const { username, password } = req.body

  try {
    const result = await query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password],
    )

    if (result.length === 0) {
      return res.status(401).json({ error: 'Fel användarnamn eller lösenord' })
    }

    const userId = result[0].id
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
  const { token, amount } = req.body

  try {
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE token = ?',
      [token],
    )

    if (sessionResult.length === 0) {
      return res.status(401).json({ error: 'Ogiltig token' })
    }

    const userId = sessionResult[0].userId

    await query('UPDATE accounts SET amount = amount + ? WHERE userId = ?', [
      Number(amount),
      userId,
    ])

    const accountResult = await query(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId],
    )

    return res.json({ amount: accountResult[0].amount })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Kunde inte genomföra insättningen' })
  }
})

app.listen(port, () => {
  console.log(`Bankens backend körs på http://127.0.0.1:${port}`)
})
