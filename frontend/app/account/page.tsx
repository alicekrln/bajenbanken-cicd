'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import beerIcon from '../../public/beer.png'

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

  const BEER_PRICE_SEK = 45
  const beerCount = Math.max(0, Math.floor(Number(balance) / BEER_PRICE_SEK))

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
        <div className='flex flex-col items-center gap-6 rounded-3xl bg-primary px-8 py-10 text-center shadow-xl md:grid md:grid-cols-3 md:items-center md:gap-0 md:text-left'>
          <div className='hidden md:block' />
          <div className='flex flex-col items-center'>
            <p className='text-sm font-bold uppercase tracking-widest text-background/80'>
              Hej där, ditt saldo är
            </p>
            <p className='font-black mt-2 text-6xl text-background'>
              {balance} kr
            </p>
          </div>
          <div className='flex justify-center md:justify-end pr-6'>
            <div className='flex flex-col items-center'>
              <Image
                src={beerIcon}
                alt='Beer Icon'
                className='max-h-20 max-w-20'
              />
              <p className='mt-2 text-sm font-bold text-background/80'>
                Räcker till {beerCount} öl
              </p>
            </div>
          </div>
        </div>

        <div className='mt-8 grid gap-6 md:grid-cols-2'>
          <form
            onSubmit={handleSubmit}
            className='min-w-0 rounded-3xl border-4 border-primary bg-card p-7 shadow-lg'
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

          <div className='min-w-0 rounded-3xl border-2 border-border bg-card p-7'>
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
                <li key={i} className='flex min-w-0 items-center gap-1 text-sm'>
                  <span className='flex aspect-square h-11 shrink-0 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground'>
                    {formatDate(t.createdAt)}
                  </span>
                  <div className='flex h-11 min-w-0 flex-1 items-center gap-2 rounded-3xl bg-secondary px-4 py-3'>
                    <span className='min-w-0 flex-1 truncate text-secondary-foreground'>
                      {t.note || 'Insättning'}
                    </span>
                    <span className='shrink-0 font-bold text-primary'>
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
