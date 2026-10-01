'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import beerIcon from '../../public/beer.png'
import Link from 'next/link'

export default function Account() {
  const [value, setValue] = useState('')
  const [balance, setBalance] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [note, setNote] = useState('')

  const BEER_PRICE_SEK = 45
  const beerCount = Math.max(0, Math.floor(Number(balance) / BEER_PRICE_SEK))

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    fetch('http://51.21.196.203:3001/me/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then((res) => res.json())
      .then((data) => setBalance(data.amount))
  }, [])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const token = localStorage.getItem('token') || ''
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
      setTimeout(() => {
        setSuccess(false)
      }, 1200)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Något fick fel, försök igen',
      )
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <div className='flex flex-col items-center justify-center gap-4 rounded-3xl bg-primary px-4 py-10 text-center shadow-xl'>
          <div className='flex flex-col items-center'>
            <p className='text-sm font-bold uppercase tracking-widest text-background/80'>
              Hej där, ditt saldo är
            </p>
            <p className='font-black mt-2 text-6xl text-background'>
              {balance} kr
            </p>
          </div>
          <p className='text-sm font-bold italic tracking-widest text-background/80'>
            Räcker till {beerCount} öl
          </p>
        </div>

        <div className='mt-8 grid gap-6'>
          <form
            onSubmit={handleSubmit}
            className='min-w-0 rounded-3xl border-4 border-primary bg-card p-7 shadow-lg'
          >
            <div className='flex justify-between'>
              <div>
                <h1 className='font-black text-2xl text-primary'>
                  Sätt in pengar
                </h1>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Överför ett belopp direkt till ditt konto.
                </p>
              </div>
              <div className='flex items-center'>
                <Link
                  href='/transactions'
                  className='px-6 py-3 font-bold rounded-full bg-primary text-background transition-colors hover:bg-secondary-foreground hover:text-background'
                >
                  Se kontohistorik
                </Link>
              </div>
            </div>
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
        </div>
      </main>
    </div>
  )
}
