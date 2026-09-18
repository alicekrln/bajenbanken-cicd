'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'))
  }, [pathname])

  function handleLogout() {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    router.push('/')
  }

  const hrefOpt = isLoggedIn ? '/account' : '/'

  return (
    <header className='border-b-4 border-primary bg-background'>
      <div className='mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4'>
        <Link
          href={hrefOpt}
          aria-label='Home'
          className='flex items-center gap-2'
        >
          <span className='grid h-10 w-10 place-items-center rounded-full bg-primary text-lg font-black text-background'>
            B
          </span>
          <span className='font-black text-2xl tracking-tight text-primary'>
            Bajenbanken
          </span>
        </Link>
        <nav className='flex items-center gap-2 text-sm font-bold'>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className='rounded-full px-4 py-2 text-primary transition-colors cursor-pointer hover:bg-primary hover:text-background'
            >
              Logga ut
            </button>
          ) : (
            <>
              <Link
                href='/register'
                className='rounded-full px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-background'
              >
                Skapa konto
              </Link>
              <Link
                href='/login'
                className='rounded-full px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-background'
              >
                Logga in
              </Link>
            </>
          )}
        </nav>
      </div>
      <div
        aria-hidden
        className='h-2 w-full'
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--color-primary) 0 14px, var(--color-background) 14px 28px)',
        }}
      />
    </header>
  )
}
