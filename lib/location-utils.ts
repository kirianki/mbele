// Utility functions for handling Kenya location data

import kenyaCounties from "./kenya-counties.json"

export type County = {
  county: string
  subcounties: string[]
}

export const getAllCounties = (): string[] => {
  return kenyaCounties.counties.map((county) => county.county)
}

export const getSubcountiesForCounty = (countyName: string): string[] => {
  const county = kenyaCounties.counties.find((c) => c.county === countyName)
  return county ? county.subcounties : []
}

export const getCountyByName = (countyName: string): County | undefined => {
  return kenyaCounties.counties.find((c) => c.county === countyName)
}

export const getPopularCounties = (): string[] => {
  // Return some of the most populated counties for quick selection
  return ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Uasin Gishu"]
}

