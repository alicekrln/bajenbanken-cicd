'use client'

import React, { useEffect, useState } from 'react'
import beerIcon from 'assets/beer.png'

export default function Account() {
  const [value, setValue] = useState('')
  const [balance, setBalance] = useState('0')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [note, setNote] = useState('')
  const [transactions, setTransactions] = useState<
    Array<{ note?: string; amount: number; createdAt: string }>
  >([])

  function fetchTransactions(t: string) {
    fetch('http://51.21.196.203:3001/me/accounts/transactions/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions || []))
  }

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    setToken(t)
    fetch('http://51.21.196.203:3001/me/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then((res) => res.json())
      .then((data) => setBalance(data.amount))
    fetchTransactions(t)
  }, [])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const parsedAmount = Number(value)

    if (!value.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Ange ett giltigt belopp i kronor.')
      return
    }

    try {
      const res = await fetch(
        'http://51.21.196.203:3001/me/accounts/transactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            amount: parsedAmount,
            note,
          }),
        },
      )
      const data = await res.json()
      setBalance(data.amount)
      setSuccess(true)
      setValue('')
      setNote('')
      fetchTransactions(token)
      setTimeout(() => {
        setSuccess(false)
      }, 4000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Något fick fel, försök igen',
      )
    }
  }

  function formatDate(dateString: string) {
    const d = new Date(dateString)
    const day = d.getDate()
    const month = d.getMonth() + 1
    return `${day}/${month}`
  }

  return (
    <div className='min-h-screen bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <div className='rounded-3xl bg-primary px-8 py-10 text-center shadow-xl'>
          <div className=''>
            <p className='text-sm font-bold uppercase tracking-widest text-background/80'>
              Hej där, ditt saldo är
            </p>
            <p className='font-black mt-2 text-6xl text-background'>
              {balance} kr
            </p>
          </div>
        </div>

        <div className='mt-8 grid gap-6 md:grid-cols-2'>
          <form
            onSubmit={handleSubmit}
            className='rounded-3xl border-4 border-primary bg-card p-7 shadow-lg'
          >
            <h1 className='font-black text-2xl text-primary'>Sätt in pengar</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Överför ett belopp direkt till ditt konto.
            </p>
            <label className='mt-5 block'>
              <span className='text-sm font-bold'>Belopp (kr)</span>
              <input
                className='mt-1 w-full rounded-3xl border-2 border-input bg-background px-4 py-3 outline-none focus:border-primary'
                type='text'
                value={value}
                placeholder='100'
                onChange={(e) => setValue(e.target.value)}
                onClick={() => setError(null)}
              />
            </label>
            <label className='mt-5 block'>
              <span className='text-sm font-bold'>Vad är det för?</span>
              <input
                className='mt-1 w-full rounded-3xl border-2 border-input bg-background px-4 py-3 outline-none focus:border-primary'
                type='text'
                value={note}
                placeholder='Vann bet'
                onChange={(e) => setNote(e.target.value)}
                maxLength={35}
                onClick={() => setError(null)}
              />
            </label>
            {error && (
              <p className='mt-3 rounded-xl bg-error/10 px-4 py-2 text-sm text-error'>
                {error}
              </p>
            )}
            <button
              type='submit'
              disabled={success}
              className='mt-5 w-full rounded-full bg-primary px-6 py-3 font-bold text-background cursor-pointer disabled:bg-secondary disabled:text-primary disabled:pointer-events-none'
            >
              {success ? 'Klirr på kontot!' : 'Sätt in'}
            </button>
          </form>

          <div className='rounded-3xl border-2 border-border bg-card p-7'>
            <h1 className='font-black text-2xl text-primary'>
              Tidigare insättningar
            </h1>
            <ul className='mt-4 max-h-70 space-y-3 overflow-y-auto pr-2'>
              {transactions.length === 0 && (
                <li className='text-sm text-muted-foreground'>
                  Inga insättningar än.
                </li>
              )}
              {transactions.map((t, i) => (
                <li key={i} className='flex gap-1 text-sm'>
                  <span className='flex items-center justify-center text-secondary-foreground rounded-full text-xs bg-secondary h-11 aspect-1/1'>
                    {formatDate(t.createdAt)}
                  </span>
                  <div className='flex items-center justify-between gap-1 rounded-3xl bg-secondary px-4 py-3 w-full h-11 flex-nowrap overflow-hidden'>
                    <span className='flex text-secondary-foreground overflow-hidden '>
                      {t.note || 'Insättning'}
                    </span>
                    <span className='font-bold text-primary min-w-max'>
                      + {t.amount} kr
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
