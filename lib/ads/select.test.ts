import { describe, it, expect } from 'vitest'
import type { AdCreative } from './types'
import { getEligibleAds, pickAd } from './select'

const base: AdCreative = {
  id: 'a',
  placement: 'home-after-latest',
  src: '/ads/x.svg',
  href: 'https://example.com',
  alt: 'ad',
  width: 1200,
  height: 200,
}

describe('getEligibleAds', () => {
  it('returns only ads matching the placement', () => {
    const ads: AdCreative[] = [base, { ...base, id: 'b', placement: 'article-in-body' }]
    expect(getEligibleAds(ads, 'home-after-latest').map((a) => a.id)).toEqual(['a'])
  })

  it('excludes ads with active === false', () => {
    const ads: AdCreative[] = [{ ...base, active: false }]
    expect(getEligibleAds(ads, 'home-after-latest')).toEqual([])
  })

  it('excludes ads missing src or href', () => {
    const ads: AdCreative[] = [
      { ...base, id: 'no-src', src: '' },
      { ...base, id: 'no-href', href: '' },
    ]
    expect(getEligibleAds(ads, 'home-after-latest')).toEqual([])
  })

  it('respects startAt / endAt flight window', () => {
    const now = 1_000_000
    const future: AdCreative = {
      ...base,
      id: 'future',
      startAt: new Date(now + 1000).toISOString(),
    }
    const past: AdCreative = { ...base, id: 'past', endAt: new Date(now - 1000).toISOString() }
    const live: AdCreative = { ...base, id: 'live', startAt: new Date(now - 1000).toISOString() }
    expect(getEligibleAds([future, past, live], 'home-after-latest', now).map((a) => a.id)).toEqual(
      ['live']
    )
  })
})

describe('pickAd', () => {
  it('returns null for an empty list', () => {
    expect(pickAd([])).toBeNull()
  })

  it('returns the only ad deterministically', () => {
    expect(pickAd([base])?.id).toBe('a')
  })

  it('defaults to the first ad when no seed is given', () => {
    const ads: AdCreative[] = [base, { ...base, id: 'b' }]
    expect(pickAd(ads)?.id).toBe('a')
  })
})
