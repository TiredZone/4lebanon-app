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
    if (ad.startAt && new Date(ad.startAt).getTime() > now) return false
    if (ad.endAt && new Date(ad.endAt).getTime() <= now) return false
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
  const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight ?? 1), 0)
  const target = (((seed ?? 0) % totalWeight) + totalWeight) % totalWeight
  let acc = 0
  for (const ad of ads) {
    acc += ad.weight ?? 1
    if (target < acc) return ad
  }
  return ads[0]
}
