<template>
  <ScopeSelector v-if="!scope" @generate="onGenerate" />
  <SheetView
    v-else-if="scope.sheetType === 'production'"
    :scope="scope"
    :orders="filteredOrders"
    @back="scope = null"
  />
  <PackSheetView
    v-else
    :scope="scope"
    :orders="filteredOrders"
    @back="scope = null"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ScopeSelector from './ScopeSelector.vue'
import SheetView from './SheetView.vue'
import PackSheetView from './PackSheetView.vue'
import { ORDERS, SERVICE_PERIODS } from '../data/mock'
import type { Order } from '../data/mock'
import type { Scope } from '../types'

// ── Active scope ────────────────────────────────────────────────────────────

const scope = ref<Scope | null>(null)

function onGenerate(s: Scope) {
  scope.value = s
}

// ── Order filtering ─────────────────────────────────────────────────────────

const filteredOrders = computed<Order[]>(() => {
  if (!scope.value) return []
  const s = scope.value

  return ORDERS.filter(order => {
    // Date filter: order.date must fall within [from, to] (inclusive)
    const orderDate = parseISODate(order.date)
    const [from, to] = s.dateRange
    if (orderDate < from || orderDate > to) return false

    // Location filter: if no locations specified, show all
    if (s.locationIds.length > 0 && !s.locationIds.includes(order.locationId)) return false

    // Time filter
    const effectiveFrom = getEffectiveTimeFrom(s)
    const effectiveTo   = getEffectiveTimeTo(s)
    if (!isTimeInWindow(order.fulfillmentTimeHHMM, effectiveFrom, effectiveTo)) return false

    return true
  })
})

// ── Time helpers ────────────────────────────────────────────────────────────

function getEffectiveTimeFrom(s: Scope): string {
  if (s.servicePeriods.length > 0) {
    const sorted = [...s.servicePeriods].sort(
      (a, b) => SERVICE_PERIODS[a].from.localeCompare(SERVICE_PERIODS[b].from)
    )
    return SERVICE_PERIODS[sorted[0]].from
  }
  return s.customTimeFrom || '00:00'
}

function getEffectiveTimeTo(s: Scope): string {
  if (s.servicePeriods.length > 0) {
    const sorted = [...s.servicePeriods].sort(
      (a, b) => SERVICE_PERIODS[b].to.localeCompare(SERVICE_PERIODS[a].to)
    )
    return SERVICE_PERIODS[sorted[0]].to
  }
  return s.customTimeTo || '23:59'
}

function isTimeInWindow(hhmm: string, from: string, to: string): boolean {
  return hhmm >= from && hhmm <= to
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setHours(0, 0, 0, 0)
  return date
}
</script>
