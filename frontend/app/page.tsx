import Link from 'next/link'

export default function Home() {
  return (
    <div className='min-h-screen bg-background'>
      <main className='mx-auto w-full max-w-5xl px-5 py-10'>
        <section className='grid items-center gap-10 md:grid-cols-2'>
          <div>
            <h1 className='mt-4 text-5xl font-black leading-tight text-primary sm:text-6xl'>
              Banken som sjunger i grönt och vitt
            </h1>
            <p className='mt-5 max-w-md text-lg text-muted-foreground'>
              Vi på Bajenbanken tror på varje bajares rätt till en till bärs.
              Registrera dig idag och öka bärsbudgeten på bara några klick.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                href='/register'
                className='flex rounded-full bg-primary px-7 py-3 items-center text-base font-bold text-background shadow-lg transition-transform hover:-translate-y-0.5'
              >
                Skapa konto
              </Link>
              <Link
                href='/login'
                className='rounded-full border-2 border-primary px-7 py-3 text-base font-bold text-primary transition-colors hover:bg-secondary'
              >
                Jag har redan ett konto
              </Link>
            </div>
          </div>

          <div className='rounded-3xl border-4 border-primary bg-card p-7 shadow-xl'>
            <p className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
              Ditt framtida bankkonto
            </p>
            <p className='font-black mt-2 text-5xl text-primary'>1889 kr</p>
            <div className='mt-6 space-y-3'>
              {[
                ['Insättning från soffan', '+ 200 kr'],
                ['Vann bet', '+ 100 kr'],
                ['Sålde avslagen bärs till gårdare', '+ 48 kr'],
              ].map(([label, amount]) => (
                <div
                  key={label}
                  className='flex items-center justify-between rounded-full bg-secondary px-4 py-3 text-sm'
                >
                  <span className='text-secondary-foreground'>{label}</span>
                  <span className='font-bold text-primary'>{amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
