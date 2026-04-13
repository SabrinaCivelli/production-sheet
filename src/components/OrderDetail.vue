<template>
  <div class="od-page">

    <!-- ── Back + breadcrumb ────────────────────────────────────────────────── -->
    <div class="od-topbar">
      <button class="back-btn" @click="emit('back')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Order management
      </button>
    </div>

    <!-- ── Header ───────────────────────────────────────────────────────────── -->
    <div class="od-header">
      <div class="od-title-row">
        <h1 class="od-title">Order #{{ order.id }}</h1>
        <div class="od-badges">
          <span class="badge" :class="statusBadgeClass(order.orderStatus)">{{ order.orderStatus }}</span>
          <span class="badge" :class="paymentBadgeClass(order.paymentStatus)">{{ order.paymentStatus }}</span>
          <span class="badge badge--type">{{ order.type }}</span>
        </div>
      </div>
      <p class="od-meta">Created {{ formatDateTime(order.created) }}</p>
    </div>

    <!-- ── Body ─────────────────────────────────────────────────────────────── -->
    <div class="od-body">

      <!-- ── Left column ──────────────────────────────────────────────────── -->
      <div class="od-main">

        <!-- Order details card -->
        <div class="od-card">
          <h2 class="card-title">Order details</h2>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value">{{ order.locationName }}</span>
            </div>
            <div v-if="order.locationAddress" class="detail-row">
              <span class="detail-label">Address</span>
              <span class="detail-value">{{ order.locationAddress }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due date</span>
              <span class="detail-value">{{ formatDate(order.date) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Due time</span>
              <span class="detail-value">{{ order.fulfillmentTimeHHMM }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Order type</span>
              <span class="detail-value">{{ order.type }}</span>
            </div>
            <div v-if="order.eventName" class="detail-row">
              <span class="detail-label">Event</span>
              <span class="detail-value">{{ order.eventName }}</span>
            </div>
            <div v-if="order.numberOfGuests" class="detail-row">
              <span class="detail-label">Guests</span>
              <span class="detail-value">{{ order.numberOfGuests }}</span>
            </div>
            <div v-if="order.cutoffTime" class="detail-row">
              <span class="detail-label">Cutoff time</span>
              <span class="detail-value">{{ formatDateTime(order.cutoffTime) }}</span>
            </div>
            <div v-if="order.note" class="detail-row">
              <span class="detail-label">Note</span>
              <span class="detail-value detail-value--note">{{ order.note }}</span>
            </div>
          </div>
        </div>

        <!-- Items card -->
        <div class="od-card">
          <h2 class="card-title">Items ({{ order.items.length }})</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-qty">Qty</th>
                <th>Item</th>
                <th class="col-price">Unit price</th>
                <th class="col-price">Line total</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in order.items" :key="item.plu + item.name">
                <tr class="item-row">
                  <td class="col-qty">{{ item.qty }}</td>
                  <td>
                    <span class="item-name">{{ item.name }}</span>
                    <span v-if="item.variant" class="item-variant"> — {{ item.variant }}</span>
                  </td>
                  <td class="col-price">${{ item.unitPrice.toFixed(2) }}</td>
                  <td class="col-price">${{ (item.qty * item.unitPrice).toFixed(2) }}</td>
                </tr>
                <!-- Modifiers row -->
                <tr v-if="item.modifiers.length" class="modifier-row">
                  <td></td>
                  <td colspan="3">
                    <span
                      v-for="mod in item.modifiers"
                      :key="mod.text"
                      class="mod-chip"
                    >{{ mod.qty > 1 ? `${mod.qty}× ` : '' }}{{ mod.text }}</span>
                  </td>
                </tr>
                <!-- Item note row -->
                <tr v-if="item.note" class="note-row">
                  <td></td>
                  <td colspan="3" class="item-note">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="note-icon">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {{ item.note }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

      </div>

      <!-- ── Right column ─────────────────────────────────────────────────── -->
      <div class="od-side">

        <!-- Customer card -->
        <div class="od-card">
          <h2 class="card-title">Customer</h2>
          <div class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">{{ order.customer }}</span>
            </div>
            <div v-if="order.account" class="detail-row">
              <span class="detail-label">Company</span>
              <span class="detail-value">{{ order.account }}</span>
            </div>
            <div v-if="order.customerEmail" class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ order.customerEmail }}</span>
            </div>
            <div v-if="order.customerPhone" class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ order.customerPhone }}</span>
            </div>
          </div>
        </div>

        <!-- Financial summary card -->
        <div class="od-card">
          <h2 class="card-title">Summary</h2>
          <div class="fin-rows">
            <div class="fin-row">
              <span>Subtotal</span>
              <span>${{ order.subTotal.toFixed(2) }}</span>
            </div>
            <div v-for="disc in order.discounts" :key="disc.name" class="fin-row fin-row--discount">
              <span>Discount ({{ disc.name }})</span>
              <span>−${{ Math.abs(disc.amount).toFixed(2) }}</span>
            </div>
            <div v-if="order.discountTotal !== 0" class="fin-row fin-row--discount">
              <span>Discount total</span>
              <span>−${{ Math.abs(order.discountTotal).toFixed(2) }}</span>
            </div>
            <div v-for="tax in order.taxes" :key="tax.name" class="fin-row">
              <span>{{ tax.name }}</span>
              <span>${{ tax.amount.toFixed(2) }}</span>
            </div>
            <div v-if="order.tip > 0" class="fin-row">
              <span>Tip</span>
              <span>${{ order.tip.toFixed(2) }}</span>
            </div>
            <div v-if="order.deliveryCost > 0" class="fin-row">
              <span>Delivery</span>
              <span>${{ order.deliveryCost.toFixed(2) }}</span>
            </div>
            <div class="fin-sep"></div>
            <div class="fin-row fin-row--total">
              <span>Total</span>
              <span>${{ order.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Order } from '../data/mock'

const props = defineProps<{ order: Order }>()
const emit  = defineEmits<{ back: [] }>()

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`
}

function formatDateTime(iso: string): string {
  const dt = new Date(iso)
  const d  = formatDate(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`)
  const h  = dt.getHours(), min = dt.getMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${d} at ${h12}:${String(min).padStart(2,'0')} ${period}`
}

function paymentBadgeClass(status: string): string {
  switch (status) {
    case 'Pre-Authorized': return 'badge--pre-auth'
    case 'Captured':       return 'badge--captured'
    case 'Failed':         return 'badge--failed'
    case 'Refunded':       return 'badge--refunded'
    default:               return 'badge--neutral'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Accepted':   return 'badge--accepted'
    case 'New':        return 'badge--new'
    case 'Completed':  return 'badge--completed'
    case 'Cancelled':  return 'badge--failed'
    case 'Failed':     return 'badge--failed'
    default:           return 'badge--neutral'
  }
}
</script>

<style scoped>
.od-page {
  padding: 24px 32px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #030213;
  max-width: 1100px;
}

/* ── Back button ─────────────────────────────────────────────────────────── */
.od-topbar {
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: #717182;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.1s;
}

.back-btn:hover { color: #030213; }

.back-btn svg {
  width: 16px;
  height: 16px;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.od-header {
  margin-bottom: 28px;
}

.od-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.od-title {
  font-size: 1.625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}

.od-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.od-meta {
  font-size: 0.8125rem;
  color: #717182;
}

/* ── Badges ──────────────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge--type      { background: #ede9fe; color: #5b21b6; }
.badge--pre-auth  { background: #dbeafe; color: #1d4ed8; }
.badge--captured  { background: #dcfce7; color: #15803d; }
.badge--failed    { background: #fee2e2; color: #b91c1c; }
.badge--refunded  { background: #fef9c3; color: #854d0e; }
.badge--neutral   { background: #f3f3f5; color: #717182; }
.badge--accepted  { background: #dcfce7; color: #15803d; }
.badge--new       { background: #dbeafe; color: #1d4ed8; }
.badge--completed { background: #f3f3f5; color: #717182; }

/* ── Body layout ─────────────────────────────────────────────────────────── */
.od-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  align-items: start;
}

/* ── Cards ───────────────────────────────────────────────────────────────── */
.od-card {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
  background: #fff;
}

.od-card:last-child { margin-bottom: 0; }

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #030213;
  margin-bottom: 16px;
}

/* ── Detail grid ─────────────────────────────────────────────────────────── */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px;
  font-size: 0.875rem;
}

.detail-label {
  color: #717182;
  font-weight: 400;
}

.detail-value {
  color: #030213;
  font-weight: 400;
}

.detail-value--note {
  color: #4a4a5a;
  font-style: italic;
}

/* ── Items table ─────────────────────────────────────────────────────────── */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.items-table thead tr {
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.items-table th {
  padding: 6px 8px;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #717182;
}

.items-table td {
  padding: 10px 8px;
  vertical-align: top;
}

.item-row td {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.item-row:last-of-type td { border-bottom: none; }

.col-qty   { width: 40px; color: #717182; }
.col-price { width: 90px; text-align: right; color: #030213; font-variant-numeric: tabular-nums; }

.item-name    { font-weight: 500; }
.item-variant { color: #717182; font-weight: 400; }

/* Modifier row */
.modifier-row td {
  padding: 0 8px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.mod-chip {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 2px 8px;
  background: #f3f3f5;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #4a4a5a;
}

/* Note row */
.note-row td {
  padding: 2px 8px 10px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.item-note {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 0.8125rem;
  color: #b86a00;
  font-style: italic;
}

.note-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  margin-top: 1px;
  color: #b86a00;
}

/* ── Financial summary ───────────────────────────────────────────────────── */
.fin-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.875rem;
}

.fin-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #030213;
}

.fin-row--discount {
  color: #15803d;
}

.fin-sep {
  height: 1px;
  background: rgba(0,0,0,0.08);
  margin: 4px 0;
}

.fin-row--total {
  font-weight: 700;
  font-size: 0.9375rem;
}
</style>
