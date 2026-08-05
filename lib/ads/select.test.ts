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

  it('selects by weight using the seed', () => {
    const ads: AdCreative[] = [base, { ...base, id: 'b', weight: 3 }]
    // total weight = 1 + 3 = 4. target 0 -> 'a'; targets 1..3 -> 'b'.
    expect(pickAd(ads, 0)?.id).toBe('a')
    expect(pickAd(ads, 1)?.id).toBe('b')
    expect(pickAd(ads, 3)?.id).toBe('b')
  })

  it('handles negative and fractional seeds deterministically', () => {
    const ads: AdCreative[] = [base, { ...base, id: 'b' }]
    // total weight = 2; seed -1 -> ((-1 % 2) + 2) % 2 = 1 -> 'b'; 2.9 -> trunc 2 -> 0 -> 'a'
    expect(pickAd(ads, -1)?.id).toBe('b')
    expect(pickAd(ads, 2.9)?.id).toBe('a')
  })
})
