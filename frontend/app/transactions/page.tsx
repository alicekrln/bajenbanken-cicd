'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Transactions() {
  const [transactions, setTransactions] = useState<
    Array<{ note?: string; amount: number; createdAt: string }>
  >([])

  useEffect(() => {
    const t = localStorage.getItem('token') || ''
    fetch('http://51.21.196.203:3001/me/accounts/transactions/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t }),
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions || []))
  })

  function formatDate(dateString: string) {
    const d = new Date(dateString)
    const day = d.getDate()
    const month = d.getMonth() + 1
    return `${day}/${month}`
  }

  return (
    <div className='bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <Link
          href='/account'
          className='flex items-center gap-2 pb-4 text-sm text-primary font-bold hover:text-secondary-foreground'
        >
          <ChevronLeft className='w-4 stroke-3' />
          Tillbaka till insättning
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
                    + {t.amount} kr
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
