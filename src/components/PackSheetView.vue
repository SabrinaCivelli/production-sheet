<template>
  <div class="sheet-page">

    <!-- ── Topbar ──────────────────────────────────────────────────────────── -->
    <div class="topbar no-print">
      <button class="btn-ghost" @click="emit('back')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12.5L5 8L10 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Scope
      </button>
      <button class="btn-dark" @click="printSheet">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6V2h8v4M4 12H2.5A.5.5 0 0 1 2 11.5v-4A.5.5 0 0 1 2.5 7h11a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H12M4 9.5h8v4.5H4V9.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Print Pack Sheet
      </button>
    </div>

    <!-- ── Content ─────────────────────────────────────────────────────────── -->
    <div class="content">
      <h1 class="page-title">Pack Sheet</h1>

      <!-- Metadata grid -->
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Location</span>
          <span class="meta-value">{{ scope.locationLabel }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Generated on</span>
          <span class="meta-value">{{ formatDateTime(scope.generatedAt) }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Date</span>
          <span class="meta-value">{{ scope.dateLabel }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Service Period</span>
          <span class="meta-value">{{ scope.timeLabel }}</span>
        </div>
      </div>

      <hr class="divider" />

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Total Orders</span>
          <span class="stat-value">{{ orders.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Pickup</span>
          <span class="stat-value">{{ pickupCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Delivery</span>
          <span class="stat-value">{{ deliveryCount }}</span>
        </div>
      </div>

      <hr class="divider" />

      <!-- Orders -->
      <h2 class="section-title">Orders to Pack</h2>

      <div v-if="orders.length === 0" class="empty-state">
        No orders match the selected scope.
      </div>

      <div v-for="order in orders" :key="order.id" class="order-card">

        <!-- Order header -->
        <div class="order-header">
          <div class="order-header-left">
            <span class="order-id">#{{ order.id }}</span>
            <span class="order-customer">{{ order.customer }}</span>
            <span v-if="order.account" class="order-account">{{ order.account }}</span>
          </div>
          <div class="order-header-right">
            <span class="order-date">{{ formatOrderDate(order.date) }}</span>
            <span class="order-date-sep">·</span>
            <span class="order-time">{{ order.fulfillmentTime }}</span>
            <span class="order-type-badge" :class="order.type === 'Pickup' ? 'badge-pickup' : 'badge-delivery'">
              {{ order.type }}
            </span>
          </div>
        </div>

        <!-- Order note -->
        <div v-if="order.note" class="order-note">
          <svg class="order-note-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4l2 2 2-2h2a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM5 6h6M5 8.5h4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="order-note-text">{{ order.note }}</span>
        </div>

        <!-- Special instructions -->
        <div v-if="order.specialInstructions" class="order-special">
          <svg class="order-note-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.507 6.507 0 0 0 8 1.5ZM8 12a.75.75 0 1 1 0-1.5A.75.75 0 0 1 8 12Zm.75-3.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 1.5 0v3.5Z" fill="currentColor"/>
          </svg>
          <span class="order-note-text">{{ order.specialInstructions }}</span>
        </div>

        <!-- Items -->
        <div class="items-list">
          <div v-for="item in order.items" :key="item.name + (item.variant ?? '')" class="item-block">

            <!-- Main item row -->
            <div class="item-row">
              <input type="checkbox" class="item-check" />
              <span class="item-name">
                {{ item.name }}<span v-if="item.variant" class="item-variant"> · {{ item.variant }}</span>
              </span>
              <span class="item-qty">{{ item.qty }}</span>
            </div>

            <!-- Modifiers -->
            <div v-for="mod in item.modifiers" :key="mod.text" class="sub-row">
              <span class="sub-bullet">—</span>
              <span class="sub-name">{{ mod.text }}</span>
              <span class="sub-qty">{{ mod.qty }}</span>
            </div>

            <!-- Sub-items -->
            <div v-for="sub in item.subItems" :key="sub.name" class="sub-row">
              <span class="sub-bullet">—</span>
              <span class="sub-name">{{ sub.name }}</span>
              <span class="sub-qty">{{ sub.qty }}</span>
            </div>

            <!-- Item note -->
            <div v-if="item.note" class="item-note-row">
              <svg class="note-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.507 6.507 0 0 0 8 1.5ZM8 12a.75.75 0 1 1 0-1.5A.75.75 0 0 1 8 12Zm.75-3.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 1.5 0v3.5Z" fill="currentColor"/>
              </svg>
              <span class="note-text">{{ item.note }}</span>
            </div>
          </div>
        </div>

        <!-- Order item total -->
        <div class="order-footer">
          <span class="order-footer-label">Items in this order</span>
          <span class="order-footer-value">{{ orderItemTotal(order) }}</span>
        </div>

      </div>

      <!-- Grand total -->
      <hr class="divider" />
      <div class="footer-total">
        <span class="footer-label">Total Items to Pack</span>
        <span class="footer-value">{{ grandTotal }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '../data/mock'
import type { Scope } from '../types'

const props = defineProps<{
  scope: Scope
  orders: Order[]
}>()

const emit = defineEmits<{
  back: []
}>()

function printSheet() {
  window.print()
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function formatOrderDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${DAYS_SHORT[dt.getDay()]}, ${MONTHS_SHORT[m - 1]} ${d}`
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const pickupCount   = computed(() => props.orders.filter(o => o.type === 'Pickup').length)
const deliveryCount = computed(() => props.orders.filter(o => o.type === 'Delivery').length)

function orderItemTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0)
}

const grandTotal = computed(() =>
  props.orders.reduce((sum, order) => sum + orderItemTotal(order), 0)
)
</script>

<style scoped>
/* ── Design tokens ────────────────────────────────────────────────────────── */
.sheet-page {
  --fg:          #030213;
  --muted:       #717182;
  --border:      rgba(0, 0, 0, 0.1);
  --border-soft: rgba(0, 0, 0, 0.06);
  --accent:      #e9ebef;
  --radius:      0.625rem;
  --note-bg:     #fffbeb;
  --note-border: rgba(180, 130, 0, 0.2);
  --note-text:   #92400e;
  --special-bg:  #fff1f2;
  --special-border: rgba(200, 0, 50, 0.15);
  --special-text: #9f1239;

  min-height: 100vh;
  background: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--fg);
}

/* ── Topbar ───────────────────────────────────────────────────────────────── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--fg);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.12s;
}
.btn-ghost:hover { background: var(--accent); }

.btn-dark {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  background: var(--fg);
  border: none;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.12s;
}
.btn-dark:hover { opacity: 0.88; }

/* ── Content ──────────────────────────────────────────────────────────────── */
.content {
  max-width: 896px;
  margin: 0 auto;
  padding: 40px 32px 72px;
}

/* ── Page title ───────────────────────────────────────────────────────────── */
.page-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--fg);
  margin: 0 0 28px;
  letter-spacing: -0.015em;
}

/* ── Metadata grid ────────────────────────────────────────────────────────── */
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 48px;
  margin-bottom: 28px;
}
.meta-item { display: flex; flex-direction: column; gap: 3px; }
.meta-label { font-size: 0.8125rem; color: var(--muted); }
.meta-value { font-size: 0.9375rem; font-weight: 500; color: var(--fg); }

/* ── Divider ──────────────────────────────────────────────────────────────── */
.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0 0 28px;
}

/* ── Stats row ────────────────────────────────────────────────────────────── */
.stats-row {
  display: flex;
  gap: 48px;
  margin-bottom: 28px;
}
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.8125rem; color: var(--muted); }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--fg); line-height: 1; }

/* ── Section title ────────────────────────────────────────────────────────── */
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--fg);
  margin: 0 0 20px;
}

/* ── Order card ───────────────────────────────────────────────────────────── */
.order-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 20px;
  overflow: hidden;
  break-inside: avoid;
}

/* ── Order header ─────────────────────────────────────────────────────────── */
.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: rgba(0, 0, 0, 0.025);
  border-bottom: 1px solid var(--border-soft);
  gap: 12px;
}

.order-header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.order-id {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--muted);
  white-space: nowrap;
}

.order-customer {
  font-size: 1rem;
  font-weight: 600;
  color: var(--fg);
}

.order-account {
  font-size: 0.875rem;
  color: var(--muted);
}

.order-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.order-date {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--fg);
}

.order-date-sep {
  font-size: 0.875rem;
  color: var(--muted);
}

.order-time {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--fg);
}

.order-type-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.badge-pickup {
  background: rgba(3, 2, 19, 0.07);
  color: var(--fg);
}

.badge-delivery {
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
}

/* ── Order note ───────────────────────────────────────────────────────────── */
.order-note,
.order-special {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--border-soft);
}

.order-note {
  background: var(--note-bg);
  border-left: 3px solid #d97706;
}

.order-special {
  background: var(--special-bg);
  border-left: 3px solid #e11d48;
}

.order-note-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.order-note .order-note-icon { color: #d97706; }
.order-special .order-note-icon { color: #e11d48; }

.order-note .order-note-text {
  font-size: 0.875rem;
  color: var(--note-text);
  line-height: 1.45;
}

.order-special .order-note-text {
  font-size: 0.875rem;
  color: var(--special-text);
  line-height: 1.45;
}

/* ── Items list ───────────────────────────────────────────────────────────── */
.items-list {
  padding: 0 18px;
}

/* ── Item block ───────────────────────────────────────────────────────────── */
.item-block {
  border-bottom: 1px solid var(--border-soft);
}
.item-block:last-child { border-bottom: none; }

/* ── Main item row ────────────────────────────────────────────────────────── */
.item-row {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 13px 0;
}

.item-check {
  width: 16px;
  height: 16px;
  accent-color: var(--fg);
  cursor: default;
  flex-shrink: 0;
}

.item-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--fg);
}

.item-variant {
  font-weight: 400;
  color: var(--muted);
}

.item-qty {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--fg);
  text-align: right;
  min-width: 28px;
}

/* ── Sub rows ─────────────────────────────────────────────────────────────── */
.sub-row {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 0 6px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.sub-bullet {
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1;
}

.sub-name {
  font-size: 0.875rem;
  color: var(--muted);
}

.sub-qty {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--fg);
  text-align: right;
  min-width: 24px;
}

/* ── Item note row ────────────────────────────────────────────────────────── */
.item-note-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 0 8px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.note-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  margin-top: 1px;
  color: #d97706;
}

.note-text {
  font-size: 0.8125rem;
  color: #92400e;
  font-style: italic;
  line-height: 1.4;
}

/* ── Order footer ─────────────────────────────────────────────────────────── */
.order-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 18px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid var(--border-soft);
}

.order-footer-label {
  font-size: 0.8125rem;
  color: var(--muted);
}

.order-footer-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--fg);
  min-width: 28px;
  text-align: right;
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
.empty-state {
  padding: 32px 0;
  color: var(--muted);
  font-size: 0.9375rem;
}

/* ── Footer total ─────────────────────────────────────────────────────────── */
.footer-total {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 4px;
}

.footer-label { font-size: 0.875rem; color: var(--muted); }

.footer-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--fg);
  line-height: 1;
}

/* ── Print ────────────────────────────────────────────────────────────────── */
@media print {
  .no-print { display: none !important; }

  .sheet-page { min-height: unset; }

  .content {
    padding: 0;
    max-width: 100%;
  }

  .order-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @page {
    size: letter;
    margin: 15mm 12mm;
  }
}
</style>
