import type { ServicePeriod } from './data/mock'

export interface Scope {
  dateRange: [Date, Date]
  servicePeriods: ServicePeriod[]  // empty = no period filter (use custom time or all day)
  customTimeFrom: string           // '' unless using custom time
  customTimeTo: string             // '' unless using custom time
  locationIds: string[]            // empty = all locations
  // Human-readable labels
  dateLabel: string
  timeLabel: string
  locationLabel: string
  summary: string
  generatedAt: Date
  sheetType: 'production' | 'production-v2' | 'pack'
}
