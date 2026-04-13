import order1Raw from '../../resources/order1.json'
import order2Raw from '../../resources/order2.json'
import order3Raw from '../../resources/order3.json'
import order4Raw from '../../resources/order4.json'
import order5Raw from '../../resources/order5.json'
import order6Raw from '../../resources/order6.json'
import order7Raw from '../../resources/order7.json'

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
  plu: string
  name: string
  /** When set, this item forms a separate aggregation line from items with the same name but different variant. */
  variant?: string
  qty: number
  /** Unit price in dollars */
  unitPrice: number
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

export interface OrderDiscount {
  name: string
  type: string
  amount: number
}

export interface OrderTax {
  name: string
  amount: number
}

export interface Order {
  id: string
  /** ISO timestamp the order was created */
  created: string
  customer: string
  customerPhone?: string
  customerEmail?: string
  /** Legal / billing account name when different from customer. */
  account?: string
  locationId: string
  locationName: string
  locationAddress?: string
  type: 'Pickup' | 'Delivery'
  /** ISO date string: YYYY-MM-DD */
  date: string
  /** Human-readable fulfillment time, e.g. "11:45am" */
  fulfillmentTime: string
  /** HH:MM for filtering against time windows */
  fulfillmentTimeHHMM: string
  eventName?: string
  numberOfGuests?: number
  cutoffTime?: string
  /** Subtotal before discounts, in dollars */
  subTotal: number
  discountTotal: number
  discounts: OrderDiscount[]
  taxes: OrderTax[]
  tip: number
  deliveryCost: number
  /** Total order value in dollars */
  total: number
  /** Catering order status label, e.g. "Accepted" */
  orderStatus: string
  /** Payment status label, e.g. "Pre-Authorized" */
  paymentStatus: string
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
  created: string
  channelOrderDisplayId: string
  locationId: string
  locationName: string
  locationAddress: string
  orderType: number
  pickupTime: string | null
  deliveryTime: string | null
  note: string | null
  restaurantNote: string | null
  cateringOrderStatus: number
  total: number
  subTotal: number
  discountTotal: number
  decimalDigits: number
  tip: number
  deliveryCost: number
  taxes: Array<{ name: string; total: number }>
  discounts: Array<{ name: string; type: string; amount: number }>
  payments: Array<{ metadata?: { status: string } }>
  eventName: string | null
  numberOfGuests: number | null
  cutoffTime: string | null
  customer: {
    name: string
    companyName: string | null
    phoneNumber?: string | null
    email?: string | null
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

const CATERING_STATUS_MAP: Record<number, string> = {
  10: 'New',
  20: 'Accepted',
  30: 'Preparing',
  40: 'Ready',
  50: 'Completed',
  60: 'Cancelled',
  70: 'Failed',
  80: 'Expired',
}

const PAYMENT_STATUS_MAP: Record<string, string> = {
  pre_authorized: 'Pre-Authorized',
  captured:       'Captured',
  failed:         'Failed',
  refunded:       'Refunded',
  pending:        'Pending',
}

function transformApiOrder(raw: ApiOrder): Order {
  const isoTime = raw.pickupTime ?? raw.deliveryTime ?? new Date().toISOString()
  const { date, time12, hhmm } = parseFulfillmentTime(isoTime)
  const rawPayStatus = raw.payments?.[0]?.metadata?.status ?? ''
  const dec = raw.decimalDigits ?? 2
  const factor = Math.pow(10, dec)

  return {
    id:                   raw.channelOrderDisplayId,
    created:              raw.created,
    customer:             raw.customer.name,
    customerPhone:        raw.customer.phoneNumber ?? undefined,
    customerEmail:        raw.customer.email ?? undefined,
    account:              raw.customer.companyName ?? undefined,
    locationId:           raw.locationId,
    locationName:         raw.locationName,
    locationAddress:      raw.locationAddress ?? undefined,
    type:                 raw.orderType === 1 ? 'Pickup' : 'Delivery',
    date,
    fulfillmentTime:      time12,
    fulfillmentTimeHHMM:  hhmm,
    eventName:            raw.eventName ?? undefined,
    numberOfGuests:       raw.numberOfGuests ?? undefined,
    cutoffTime:           raw.cutoffTime ?? undefined,
    subTotal:             (raw.subTotal ?? 0) / factor,
    discountTotal:        (raw.discountTotal ?? 0) / factor,
    discounts:            (raw.discounts ?? []).map(d => ({
                            name:   d.name,
                            type:   d.type,
                            amount: d.amount / factor,
                          })),
    taxes:                (raw.taxes ?? []).map(t => ({
                            name:   t.name,
                            amount: t.total / factor,
                          })),
    tip:                  (raw.tip ?? 0) / factor,
    deliveryCost:         (raw.deliveryCost ?? 0) / factor,
    total:                raw.total / factor,
    orderStatus:          CATERING_STATUS_MAP[raw.cateringOrderStatus] ?? 'Unknown',
    paymentStatus:        PAYMENT_STATUS_MAP[rawPayStatus] ?? rawPayStatus,
    note:                 raw.note ?? raw.restaurantNote ?? undefined,
    flags:                {},
    items: raw.items.map(item => ({
      plu:       item.plu,
      name:      item.name,
      qty:       item.quantity,
      unitPrice: item.price / factor,
      category:  'Menu Items',
      modifiers: flattenModifiers(item.subItems, item.quantity),
      note:      item.remark ?? undefined,
    })),
  }
}

// ── API v2 (alternate schema used by order7+) ──────────────────────────────

interface ApiOrderV2 {
  _created: string
  channelOrderDisplayId: string
  location: string           // locationId
  locationName: string
  orderType: number
  pickupTime: string | null
  deliveryTime: string | null
  note: string | null
  status: number
  payment: { amount: number } | null
  payments: Array<{ amount?: number; metadata?: { status: string } }>
  decimalDigits: number
  taxTotal: number
  discountTotal: number
  discounts: Array<{ name: string; type: string; amount: number }>
  taxes: Array<{ name: string; total: number }>
  tip: number
  deliveryCost: number
  customer: {
    name: string
    phoneNumber?: string | null
    email?: string | null
  }
  items: ApiItem[]
}

const V2_STATUS_MAP: Record<number, string> = {
  1: 'Accepted',
  2: 'New',
  3: 'Preparing',
  4: 'Ready',
  5: 'Completed',
  6: 'Cancelled',
  7: 'Failed',
}

function transformApiOrderV2(raw: ApiOrderV2): Order {
  const isoTime = raw.pickupTime ?? raw.deliveryTime ?? new Date().toISOString()
  const { date, time12, hhmm } = parseFulfillmentTime(isoTime)
  const dec    = raw.decimalDigits ?? 2
  const factor = Math.pow(10, dec)
  const totalCents    = raw.payment?.amount ?? raw.payments?.[0]?.amount ?? 0
  const subTotalCents = totalCents - (raw.discountTotal ?? 0) - (raw.taxTotal ?? 0)
  const rawPayStatus  = raw.payments?.[0]?.metadata?.status ?? ''

  return {
    id:            raw.channelOrderDisplayId,
    created:       raw._created,
    customer:      raw.customer.name,
    customerPhone: raw.customer.phoneNumber ?? undefined,
    customerEmail: raw.customer.email ?? undefined,
    locationId:    raw.location,
    locationName:  raw.locationName,
    type:          raw.orderType === 1 ? 'Pickup' : 'Delivery',
    date,
    fulfillmentTime:     time12,
    fulfillmentTimeHHMM: hhmm,
    subTotal:      subTotalCents / factor,
    discountTotal: (raw.discountTotal ?? 0) / factor,
    discounts:     (raw.discounts ?? []).map(d => ({ name: d.name, type: d.type, amount: d.amount / factor })),
    taxes:         (raw.taxes ?? []).map(t => ({ name: t.name, amount: t.total / factor })),
    tip:           (raw.tip ?? 0) / factor,
    deliveryCost:  (raw.deliveryCost ?? 0) / factor,
    total:         totalCents / factor,
    orderStatus:   V2_STATUS_MAP[raw.status] ?? 'Unknown',
    paymentStatus: PAYMENT_STATUS_MAP[rawPayStatus] ?? rawPayStatus,
    note:          raw.note ?? undefined,
    flags:         {},
    items: raw.items.map(item => ({
      plu:       item.plu,
      name:      item.name,
      qty:       item.quantity,
      unitPrice: item.price / factor,
      category:  'Menu Items',
      modifiers: flattenModifiers(item.subItems, item.quantity),
      note:      (item as ApiItem & { remark?: string | null }).remark ?? undefined,
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
  transformApiOrder(order4Raw as unknown as ApiOrder),
  transformApiOrder(order5Raw as unknown as ApiOrder),
  transformApiOrder(order6Raw as unknown as ApiOrder),
  transformApiOrderV2(order7Raw as unknown as ApiOrderV2),
]
