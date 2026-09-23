'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch('http://51.21.196.203:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })
      if (!res.ok) {
        throw new Error(`Registrering misslyckades: ${res.status}`)
      }
      router.push('/login')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Det där användarnamnet är redan taget. Kanske lägg till turnummer?.',
      )
    }
  }
  return (
    <div className='min-h-screen bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <div className='mx-auto max-w-md rounded-3xl border-4 border-primary bg-card p-8 shadow-xl'>
          <h1 className='font-bold text-3xl text-primary'>Öppna ett konto</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Bara två fält emellan dig och rikedom.
          </p>
          <form onSubmit={(event) => {
            handleSubmit(event)
          }} 
          className='mt-6 space-y-4'>
            <label className='block'>
              <span className='text-sm font-bold text-foreground'>
                Användarnamn
              </span>
              <input
                className='mt-1 w-full rounded-full border-2 border-input bg-background px-4 py-3 outline-none focus:border-primary placeholder:italic'
                type='text'
                aria-label='Username'
                value={username}
                placeholder='kentakompis'
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className='block'>
              <span className='text-sm font-bold text-foreground'>
                Lösenord
              </span>
              <input
                className='mt-1 w-full rounded-full border-2 border-input bg-background px-4 py-3 outline-none focus:border-primary placeholder:italic'
                type='password'
                aria-label='Password'
                value={password}
                placeholder='halvklurigt lösenord'
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className='rounded-xl bg-error/10 px-4 py-2 text-sm text-error'>
                {error}
              </p>
            )}
            <button
              type='submit'
              className='w-full rounded-full bg-primary px-6 py-3 font-bold text-background'
            >
              Skapa konto
            </button>
          </form>
          <Link
            href='/'
            aria-label='Home'
            className='mt-4 block w-full rounded-full border-2 border-primary px-6 py-3 text-center font-bold text-primary transition-colors hover:bg-secondary'
          >
            Tillbaka till start
          </Link>
        </div>
      </main>
    </div>
  )
}
