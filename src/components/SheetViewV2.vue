<template>
  <div class="sheet-page">

    <!-- ── Topbar ──────────────────────────────────────────────────────────── -->
    <div class="topbar no-print">
      <button class="btn-ghost" @click="emit('back')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12.5L5 8L10 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>
      <button class="btn-dark" @click="printSheet">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6V2h8v4M4 12H2.5A.5.5 0 0 1 2 11.5v-4A.5.5 0 0 1 2.5 7h11a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H12M4 9.5h8v4.5H4V9.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Print Sheet
      </button>
    </div>

    <!-- ── Content ─────────────────────────────────────────────────────────── -->
    <div class="content">
      <h1 class="page-title">Production Sheet <span class="v2-badge">v2</span></h1>

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

      <h2 class="section-title">Production Items</h2>

      <div v-if="orders.length === 0" class="empty-state">
        No orders match the selected scope.
      </div>

      <!-- ── Item groups ───────────────────────────────────────────────────── -->
      <div
        v-for="group in groups"
        :key="group.key"
        class="item-block"
      >
        <!-- Main item row -->
        <div class="item-row">
          <input type="checkbox" class="item-check" />
          <span class="item-name">
            {{ group.name }}<span v-if="group.variant" class="item-variant"> · {{ group.variant }}</span>
          </span>
          <span class="item-qty">{{ group.qty }}</span>
        </div>

        <!-- Modifier rows -->
        <div
          v-for="mod in group.modifiers"
          :key="mod.text"
          class="sub-row"
        >
          <input type="checkbox" class="sub-check" />
          <span class="sub-name">{{ mod.text }}</span>
          <span class="sub-qty">{{ mod.qty }}</span>
        </div>

        <!-- Item note -->
        <div v-if="group.note" class="item-note-row">
          <svg class="note-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.507 6.507 0 0 0 8 1.5ZM8 12a.75.75 0 1 1 0-1.5A.75.75 0 0 1 8 12Zm.75-3.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 1.5 0v3.5Z" fill="currentColor"/>
          </svg>
          <span class="note-text">{{ group.note }}</span>
        </div>
      </div>

      <!-- Footer total -->
      <hr class="divider" />
      <div class="footer-total">
        <span class="footer-label">Total Items to Prepare</span>
        <span class="footer-value">{{ totalQty }}</span>
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

const emit = defineEmits<{ back: [] }>()

function printSheet() { window.print() }

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

const pickupCount  = computed(() => props.orders.filter(o => o.type === 'Pickup').length)
const deliveryCount = computed(() => props.orders.filter(o => o.type === 'Delivery').length)

// ── V2 grouping: one entry per unique (name + variant + exact modifier set) ──

interface V2ModLine { text: string; qty: number }

interface V2Group {
  key: string
  name: string
  variant?: string
  qty: number
  modifiers: V2ModLine[]
  note?: string
}

const groups = computed<V2Group[]>(() => {
  const map = new Map<string, V2Group>()
  const groupInsertOrder = new Map<string, number>()
  let insertIdx = 0

  for (const order of props.orders) {
    for (const item of order.items) {
      // Fingerprint: name + variant + sorted modifier texts
      const modFingerprint = item.modifiers
        .map(m => m.text)
        .slice()
        .sort()
        .join('\x00')
      const key = `${item.name}\x01${item.variant ?? ''}\x01${modFingerprint}`

      if (!map.has(key)) {
        map.set(key, {
          key,
          name: item.name,
          variant: item.variant,
          qty: 0,
          modifiers: item.modifiers.map(m => ({ text: m.text, qty: 0 })),
          note: item.note,
        })
        groupInsertOrder.set(key, insertIdx++)
      }

      const group = map.get(key)!
      group.qty += item.qty

      for (const mod of item.modifiers) {
        const existing = group.modifiers.find(m => m.text === mod.text)
        if (existing) existing.qty += mod.qty
      }

      if (!group.note && item.note) group.note = item.note
    }
  }

  // Sort: primary alphabetically by item name, secondary by insertion order within that name
  return [...map.values()].sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name)
    if (nameCmp !== 0) return nameCmp
    return (groupInsertOrder.get(a.key) ?? 0) - (groupInsertOrder.get(b.key) ?? 0)
  })
})

const totalQty = computed(() =>
  groups.value.reduce((sum, g) => sum + g.qty, 0)
)
</script>

<style scoped>
.sheet-page {
  --fg: #030213;
  --muted: #717182;
  --border: rgba(0, 0, 0, 0.1);
  --border-soft: rgba(0, 0, 0, 0.06);
  --accent: #e9ebef;
  --radius: 0.625rem;

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

.page-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--fg);
  margin: 0 0 28px;
  letter-spacing: -0.015em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.v2-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--fg);
  color: #fff;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.03em;
  vertical-align: middle;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 48px;
  margin-bottom: 28px;
}
.meta-item { display: flex; flex-direction: column; gap: 3px; }
.meta-label { font-size: 0.8125rem; color: var(--muted); }
.meta-value { font-size: 0.9375rem; font-weight: 500; color: var(--fg); }

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0 0 28px;
}

.stats-row { display: flex; gap: 48px; margin-bottom: 28px; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.8125rem; color: var(--muted); }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--fg); line-height: 1; }

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--fg);
  margin: 0 0 24px;
}

.empty-state { padding: 32px 0; color: var(--muted); font-size: 0.9375rem; }

/* ── Item block ───────────────────────────────────────────────────────────── */
.item-block {
  border-bottom: 1px solid var(--border-soft);
}
.item-block:last-of-type { border-bottom: none; }

/* ── Main item row ────────────────────────────────────────────────────────── */
.item-row {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 14px 0 10px;
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
  font-weight: 600;
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

/* ── Modifier sub-rows ───────────────────────────────────────────────────── */
.sub-row {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 7px 0 7px 26px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.sub-check {
  width: 14px;
  height: 14px;
  accent-color: var(--fg);
  cursor: default;
  flex-shrink: 0;
}

.sub-name { font-size: 0.875rem; color: var(--muted); }

.sub-qty {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--fg);
  text-align: right;
  min-width: 28px;
}

/* ── Item note ────────────────────────────────────────────────────────────── */
.item-note-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 0 8px 26px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}
.note-icon { width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px; color: var(--muted); opacity: 0.7; }
.note-text { font-size: 0.8125rem; color: var(--muted); font-style: italic; line-height: 1.4; }

/* ── Footer total ─────────────────────────────────────────────────────────── */
.footer-total {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 4px;
}
.footer-label { font-size: 0.875rem; color: var(--muted); }
.footer-value { font-size: 3rem; font-weight: 700; color: var(--fg); line-height: 1; }

/* ── Print ────────────────────────────────────────────────────────────────── */
@media print {
  .no-print { display: none !important; }
  .sheet-page { min-height: unset; }
  .content { padding: 0; max-width: 100%; }
  @page { size: letter; margin: 15mm 12mm; }
}
</style>
