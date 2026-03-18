'use client'

import { useEffect } from 'react'
import clarity from '@microsoft/clarity'

export function ClarityProvider() {
  useEffect(() => {
    clarity.init('vxo3nye6zu')
  }, [])

  return null
}
