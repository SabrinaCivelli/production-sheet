<template>
  <OrderDetail v-if="selectedOrder" :order="selectedOrder" @back="selectedOrder = null" />

  <div v-else class="om-page">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="om-header">
      <div class="om-breadcrumb">
        <svg class="bcrumb-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
        Catering
      </div>
      <h1 class="om-title">Order management</h1>
    </div>

    <!-- ── Tabs ────────────────────────────────────────────────────────────── -->
    <div class="om-tabs">
      <button class="om-tab om-tab--active">All</button>
    </div>

    <!-- ── Toolbar ─────────────────────────────────────────────────────────── -->
    <div class="om-toolbar">
      <button class="loc-pill">
        <svg class="loc-pin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        All Locations
      </button>

      <button class="refresh-btn">
        <svg class="refresh-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- ── Table ───────────────────────────────────────────────────────────── -->
    <div class="om-table-wrap">
      <table class="om-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Location</th>
            <th>Due date</th>
            <th>Due time</th>
            <th>Order type</th>
            <th>Payment status</th>
            <th>Order value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="clickable-row"
            @click="selectedOrder = order"
          >
            <td class="cell-id">{{ order.id }}</td>
            <td>{{ order.locationName }}</td>
            <td>{{ formatDate(order.date) }}</td>
            <td>{{ order.fulfillmentTimeHHMM }}</td>
            <td>
              <span class="badge badge--type">{{ order.type }}</span>
            </td>
            <td>
              <span class="badge" :class="paymentBadgeClass(order.paymentStatus)">
                {{ order.paymentStatus }}
              </span>
            </td>
            <td>${{ order.total.toFixed(2) }}</td>
            <td>
              <span class="badge" :class="statusBadgeClass(order.orderStatus)">
                {{ order.orderStatus }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ORDERS } from '../data/mock'
import type { Order } from '../data/mock'
import OrderDetail from './OrderDetail.vue'

const selectedOrder = ref<Order | null>(null)
const orders        = ref<Order[]>([...ORDERS])

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`
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
    case 'Cancelled':  return 'badge--cancelled'
    case 'Failed':     return 'badge--failed'
    case 'Expired':    return 'badge--neutral'
    default:           return 'badge--neutral'
  }
}
</script>

<style scoped>
.om-page {
  padding: 28px 32px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #030213;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.om-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #717182;
  margin-bottom: 6px;
}

.bcrumb-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.om-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #030213;
  margin-bottom: 20px;
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
.om-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  padding-bottom: 0;
}

.om-tab {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: #717182;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  position: relative;
  transition: color 0.1s;
}

.om-tab--active {
  color: #030213;
  font-weight: 600;
  background: #ececf0;
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.om-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.loc-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 9999px;
  background: #fff;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s;
}

.loc-pill:hover { background: #f3f3f5; }

.loc-pin {
  width: 14px;
  height: 14px;
  color: #717182;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 6px;
  background: #fff;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s;
}

.refresh-btn:hover { background: #f3f3f5; }

.refresh-icon {
  width: 13px;
  height: 13px;
  color: #717182;
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.om-table-wrap {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
  overflow: hidden;
}

.om-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.om-table thead tr {
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.om-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #717182;
  white-space: nowrap;
  background: #fff;
}

.om-table td {
  padding: 14px 16px;
  color: #030213;
  vertical-align: middle;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.om-table tbody tr:last-child td {
  border-bottom: none;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover td {
  background: #f5f5f8;
}

.cell-id {
  font-weight: 600;
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

/* Order type */
.badge--type {
  background: #ede9fe;
  color: #5b21b6;
}

/* Payment statuses */
.badge--pre-auth {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge--captured {
  background: #dcfce7;
  color: #15803d;
}

.badge--failed {
  background: #fee2e2;
  color: #b91c1c;
}

.badge--refunded {
  background: #fef9c3;
  color: #854d0e;
}

.badge--neutral {
  background: #f3f3f5;
  color: #717182;
}

/* Order statuses */
.badge--accepted {
  background: #dcfce7;
  color: #15803d;
}

.badge--new {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge--completed {
  background: #f3f3f5;
  color: #717182;
}

.badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

</style>
