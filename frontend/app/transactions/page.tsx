'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatValue } from '../utils/formatValue'
import { useRouter } from 'next/navigation'

type Transaction = { note?: string; amount: number; createdAt: string }

function formatDate(dateString: string) {
  const d = new Date(dateString)
  const day = d.getDate()
  const month = d.getMonth() + 1
  return `${day}/${month}`
}

export default function Transactions() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.replace('/login')
      return
    }

    async function loadTransactions() {
      try {
        const res = await fetch(
          'http://51.21.196.203:3001/me/accounts/transactions/history',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token }),
          },
        )

        if (res.status === 401) {
          localStorage.removeItem('token')
          window.dispatchEvent(new Event('auth-change'))
          router.replace('/login')
          return
        }

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Kunde inte hämta transaktioner')
          return
        }

        setTransactions(data.transactions)
      } catch {
        setError('Kunde inte nå servern')
      }
    }

    loadTransactions()
  }, [router])

  if (error) {
    return (
      <p className='mx-auto max-w-5xl px-5 py-10 text-error'>{error}</p>
    )
  }

  if (transactions === null) {
    return <p className='mx-auto max-w-5xl px-5 py-10'>Laddar...</p>
  }

  return (
    <div className='bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <Link
          href='/account'
          className='flex items-center gap-2 pb-4 text-sm text-primary font-bold hover:text-secondary-foreground'
        >
          <ChevronLeft className='w-3.5 stroke-4' />
          Tillbaka till kontoöversikt
        </Link>
        <div className='min-w-0 rounded-3xl border-2 border-border bg-card p-7'>
          <h1 className='font-black text-2xl text-primary'>
            Tidigare insättningar
          </h1>
          <ul className='mt-4 max-h-96 space-y-3 overflow-y-auto pr-2'>
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
                    + {formatValue(t.amount.toString())} kr
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
