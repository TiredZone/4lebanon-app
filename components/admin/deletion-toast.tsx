'use client'

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { SUCCESS_MESSAGES } from '@/lib/constants'

export function DeletionToast() {
  useEffect(() => {
    if (sessionStorage.getItem('articleDeleted')) {
      sessionStorage.removeItem('articleDeleted')
      toast.success(SUCCESS_MESSAGES.articleDeleted)
    }
  }, [])

  return null
}
