import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Cabij Branding OS workspace for client intake, strategy, references, and deliverables.',
  title: 'Cabij Branding OS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
