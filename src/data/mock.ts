import order1Raw from '../../resources/order1.json'
import order2Raw from '../../resources/order2.json'
import order3Raw from '../../resources/order3.json'
import order5Raw from '../../resources/order5.json'
import order6Raw from '../../resources/order6.json'

// ── Types ──────────────────────────────────────────────────────────────────

export type ServicePeriod = 'breakfast' | 'lunch' | 'afternoon' | 'dinner'

export interface ServicePeriodMeta {
  label: string
  from: string  // HH:MM
  to: string    // HH:MM
}

export const SERVICE_PERIODS: Record<ServicePeriod, ServicePeriodMeta> = {
  breakfast: { label: 'Breakfast', from: '06:00', to: '11:00' },
  lunch:     { label: 'Lunch',     from: '11:00', to: '14:00' },
  afternoon: { label: 'Afternoon', from: '14:00', to: '17:00' },
  dinner:    { label: 'Dinner',    from: '17:00', to: '21:00' },
}

export interface Location {
  id: string
  name: string
}

export interface SubItem {
  name: string
  qty: number
  note?: string
}

export interface ItemModifier {
  text: string
  qty: number
  note?: string
}

export interface OrderItem {
  name: string
  /** When set, this item forms a separate aggregation line from items with the same name but different variant. */
  variant?: string
  qty: number
  category: string
  modifiers: ItemModifier[]
  /** Bundled sub-items inside this item (e.g. sandwich inside a boxed lunch). */
  subItems?: SubItem[]
  /** Item-level prep note. */
  note?: string
}

export interface OrderFlags {
  dietary?: string[]
  allergy?: string[]
  urgent?: boolean
  /** Requires manager sign-off before prep begins. */
  manualReview?: boolean
}

export interface Order {
  id: string
  customer: string
  /** Legal / billing account name when different from customer. */
  account?: string
  locationId: string
  type: 'Pickup' | 'Delivery'
  /** ISO date string: YYYY-MM-DD */
  date: string
  /** Human-readable fulfillment time, e.g. "11:45am" */
  fulfillmentTime: string
  /** HH:MM for filtering against time windows */
  fulfillmentTimeHHMM: string
  /** Order-level coordination note. */
  note?: string
  /** Non-standard customer request or exception. */
  specialInstructions?: string
  flags: OrderFlags
  items: OrderItem[]
}

// ── Raw API types ──────────────────────────────────────────────────────────

interface ApiSubItem {
  plu: string
  name: string
  price: number
  quantity: number
  subItems: ApiSubItem[]
  remark: string | null
}

interface ApiItem {
  plu: string
  name: string
  price: number
  quantity: number
  subItems: ApiSubItem[]
  remark: string | null
}

interface ApiOrder {
  id: string
  channelOrderDisplayId: string
  locationId: string
  locationName: string
  orderType: number
  pickupTime: string | null
  deliveryTime: string | null
  note: string | null
  restaurantNote: string | null
  customer: {
    name: string
    companyName: string | null
  }
  items: ApiItem[]
}

// ── API → internal transformer ─────────────────────────────────────────────

/**
 * Recursively flattens API subItems into modifiers.
 * Container groups (subItems with their own children) are skipped — only
 * leaf selections are included, scaled by their parent quantities.
 */
function flattenModifiers(subItems: ApiSubItem[], multiplier: number): ItemModifier[] {
  const result: ItemModifier[] = []
  for (const sub of subItems) {
    if (!sub.subItems || sub.subItems.length === 0) {
      result.push({ text: sub.name, qty: sub.quantity * multiplier })
    } else {
      result.push(...flattenModifiers(sub.subItems, sub.quantity * multiplier))
    }
  }
  return result
}

function parseFulfillmentTime(isoString: string): { date: string; time12: string; hhmm: string } {
  const dt = new Date(isoString)
  const y  = dt.getFullYear()
  const m  = String(dt.getMonth() + 1).padStart(2, '0')
  const d  = String(dt.getDate()).padStart(2, '0')
  const h  = dt.getHours()
  const min = dt.getMinutes()
  const period = h >= 12 ? 'pm' : 'am'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return {
    date:   `${y}-${m}-${d}`,
    time12: `${h12}:${String(min).padStart(2, '0')}${period}`,
    hhmm:   `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
  }
}

function transformApiOrder(raw: ApiOrder): Order {
  const isoTime = raw.pickupTime ?? raw.deliveryTime ?? new Date().toISOString()
  const { date, time12, hhmm } = parseFulfillmentTime(isoTime)

  return {
    id:                   raw.channelOrderDisplayId,
    customer:             raw.customer.name,
    account:              raw.customer.companyName ?? undefined,
    locationId:           raw.locationId,
    type:                 raw.orderType === 1 ? 'Pickup' : 'Delivery',
    date,
    fulfillmentTime:      time12,
    fulfillmentTimeHHMM:  hhmm,
    note:                 raw.note ?? raw.restaurantNote ?? undefined,
    flags:                {},
    items: raw.items.map(item => ({
      name:      item.name,
      qty:       item.quantity,
      category:  'Menu Items',
      modifiers: flattenModifiers(item.subItems, item.quantity),
      note:      item.remark ?? undefined,
    })),
  }
}

// ── Locations ──────────────────────────────────────────────────────────────

export const LOCATIONS: Location[] = [
  { id: '6977b85198bbc859ada4c183', name: 'Location 2 - Manhattan' },
  { id: '6977b8d86d1470e5d28674c7', name: 'Location 3 - Soho' },
]

// ── Category display order ─────────────────────────────────────────────────

export const CATEGORY_ORDER: string[] = [
  'Menu Items',
]

// ── Orders ─────────────────────────────────────────────────────────────────

export const ORDERS: Order[] = [
  transformApiOrder(order1Raw as unknown as ApiOrder),
  transformApiOrder(order2Raw as unknown as ApiOrder),
  transformApiOrder(order3Raw as unknown as ApiOrder),
  transformApiOrder(order5Raw as unknown as ApiOrder),
  transformApiOrder(order6Raw as unknown as ApiOrder),
]
