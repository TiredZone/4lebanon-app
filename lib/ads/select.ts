import type { AdCreative, AdPlacement } from './types'

/**
 * Filter ads down to those eligible for a placement right now.
 * Pure — `now` is injectable for testing.
 */
export function getEligibleAds(
  ads: AdCreative[],
  placement: AdPlacement,
  now: number = Date.now()
): AdCreative[] {
  return ads.filter((ad) => {
    if (ad.placement !== placement) return false
    if (ad.active === false) return false
    if (!ad.src || !ad.href) return false
    // Fail safe: a malformed date string parses to NaN — ignore the constraint
    // rather than letting NaN comparisons silently keep (or hide) the ad.
    if (ad.startAt) {
      const start = new Date(ad.startAt).getTime()
      if (Number.isFinite(start) && start > now) return false
    }
    if (ad.endAt) {
      const end = new Date(ad.endAt).getTime()
      if (Number.isFinite(end) && end <= now) return false
    }
    return true
  })
}

/**
 * Pick one ad by weight. Deterministic: with no seed it returns the first ad,
 * so server and client render identically (no hydration mismatch).
 */
export function pickAd(ads: AdCreative[], seed?: number): AdCreative | null {
  if (ads.length === 0) return null
  if (ads.length === 1) return ads[0]
  // Clamp weights to non-negative integers so bad config can't corrupt the walk.
  const weightOf = (ad: AdCreative) => Math.max(0, Math.floor(ad.weight ?? 1))
  const totalWeight = ads.reduce((sum, ad) => sum + weightOf(ad), 0)
  if (totalWeight === 0) return ads[0]
  const safeSeed = Math.trunc(seed ?? 0)
  const target = ((safeSeed % totalWeight) + totalWeight) % totalWeight
  let acc = 0
  for (const ad of ads) {
    acc += weightOf(ad)
    if (target < acc) return ad
  }
  return ads[0]
}
