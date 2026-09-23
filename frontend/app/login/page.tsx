'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch('http://51.21.196.203:3001/sessions', {
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
        throw new Error(`Inloggning misslyckades: ${res.status}`)
      }
      const data = await res.json()
      localStorage.setItem('token', data.token)
      window.dispatchEvent(new Event('auth-change'))
      router.push('/account')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Fel användarnamn eller lösenord.',
      )
    }
  }
  return (
    <div className='min-h-screen bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <div className='mx-auto max-w-md rounded-3xl border-4 border-primary bg-card p-8 shadow-xl'>
          <h1 className='font-bold text-3xl text-primary'>
            Välkommen tillbaka
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Dina pengar har saknat dig.
          </p>
          <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            <label className='block'>
              <span className='text-sm font-bold text-foreground'>
                Användarnamn
              </span>
              <input
                className='mt-1 w-full rounded-full border-2 border-input bg-background px-4 py-3 outline-none focus:border-primary'
                type='text'
                aria-label='Username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className='block'>
              <span className='text-sm font-bold text-foreground'>
                Lösenord
              </span>
              <input
                className='mt-1 w-full rounded-full border-2 border-input bg-background px-4 py-3 outline-none focus:border-primary'
                type='password'
                aria-label='Password'
                value={password}
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
              Logga in
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
