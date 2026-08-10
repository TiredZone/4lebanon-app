import { describe, it, expect } from 'vitest'
import type { AdCreative } from './types'
import { getEligibleAds, pickAd, startIndexFor } from './select'
import { ADS } from './config'

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

describe('startIndexFor', () => {
  it('returns 0 when there is nothing to rotate', () => {
    expect(startIndexFor('home-top', 0)).toBe(0)
    expect(startIndexFor('home-top', 1)).toBe(0)
  })

  it('is stable for the same placement — SSR and hydration must agree', () => {
    expect(startIndexFor('home-top', 3)).toBe(startIndexFor('home-top', 3))
  })

  it('always lands inside the slide range', () => {
    const placements = ['home-top', 'home-after-featured', 'home-after-latest', 'article-top']
    for (const placement of placements) {
      for (const count of [2, 3, 4, 7]) {
        const index = startIndexFor(placement, count)
        expect(Number.isInteger(index)).toBe(true)
        expect(index).toBeGreaterThanOrEqual(0)
        expect(index).toBeLessThan(count)
      }
    }
  })

  it('does not give every placement the same lead slide', () => {
    const leads = new Set(
      ['home-top', 'home-after-featured', 'home-after-latest', 'home-before-mostread'].map((p) =>
        startIndexFor(p, 2)
      )
    )
    expect(leads.size).toBeGreaterThan(1)
  })
})

describe('ADS config invariants', () => {
  it('gives every placement a single aspect ratio', () => {
    // A slot reserves ONE box for all of its creatives. Mixed ratios inside a
    // placement would shift the page each time the carousel advances, which is
    // the exact CLS failure the ad system exists to avoid.
    const byPlacement = new Map<string, AdCreative[]>()
    for (const ad of ADS) {
      byPlacement.set(ad.placement, [...(byPlacement.get(ad.placement) ?? []), ad])
    }

    const offenders: string[] = []
    for (const [placement, ads] of byPlacement) {
      const ratios = new Set(ads.map((ad) => (ad.width / ad.height).toFixed(4)))
      if (ratios.size > 1) {
        offenders.push(
          `${placement}: ${ads.map((ad) => `${ad.id}=${ad.width}x${ad.height}`).join(', ')}`
        )
      }
    }

    expect(offenders).toEqual([])
  })

  it('gives every creative a unique id and positive dimensions', () => {
    const ids = ADS.map((ad) => ad.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const ad of ADS) {
      expect(ad.width).toBeGreaterThan(0)
      expect(ad.height).toBeGreaterThan(0)
    }
  })
})
