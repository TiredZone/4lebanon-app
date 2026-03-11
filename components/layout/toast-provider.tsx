'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#ffffff',
          color: '#1f2937',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
          fontFamily: 'var(--font-cairo), sans-serif',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#830005',
            secondary: '#ffffff',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#830005',
            secondary: '#ffffff',
          },
        },
      }}
    />
  )
}
