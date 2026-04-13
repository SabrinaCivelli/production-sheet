<template>
  <div class="app-shell">
    <!-- ── Left Sidebar ──────────────────────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-header">Direct Suite</div>

      <nav class="sidebar-nav">
        <!-- Home -->
        <button class="nav-item">
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>

        <!-- Settings -->
        <button class="nav-item">
          <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
          <svg class="nav-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <!-- Sales Channels label -->
        <div class="nav-section-label">Sales Channels</div>

        <!-- Catering group -->
        <div class="nav-group">
          <button class="nav-item nav-item--group" @click="cateringOpen = !cateringOpen">
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
            Catering
            <svg
              class="nav-chevron"
              :class="{ 'nav-chevron--up': cateringOpen }"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          <div v-if="cateringOpen" class="nav-children">
            <button class="nav-child">Order management</button>
            <button class="nav-child">Payment Configuration</button>
            <button
              class="nav-child"
              :class="{ 'nav-child--active': activeView === 'production-tools' }"
              @click="activeView = 'production-tools'"
            >
              Production Tools
            </button>
            <button class="nav-child">Orders</button>
          </div>
        </div>
      </nav>
    </aside>

    <!-- ── Right Content ─────────────────────────────────────────────────── -->
    <main class="content-area">
      <ProductionSheet v-if="activeView === 'production-tools'" />
      <div v-else class="content-empty"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProductionSheet from './components/ProductionSheet.vue'

const cateringOpen = ref(true)
const activeView   = ref<'production-tools' | null>(null)
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #fff;
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  background: #fff;
}

.sidebar-header {
  font-size: 1rem;
  font-weight: 700;
  color: #030213;
  padding: 8px 12px 16px;
  letter-spacing: -0.01em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-section-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #717182;
  padding: 12px 12px 4px;
  letter-spacing: 0.01em;
}

/* ── Nav items ───────────────────────────────────────────────────────────── */
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.nav-item:hover { background: #f3f3f5; }

.nav-item--group { font-weight: 500; }

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #717182;
}

.nav-chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-left: auto;
  color: #717182;
  transition: transform 0.15s;
}

.nav-chevron--up {
  transform: rotate(180deg);
}

/* ── Nav group children ──────────────────────────────────────────────────── */
.nav-group {
  display: flex;
  flex-direction: column;
}

.nav-children {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 8px;
  margin-top: 2px;
}

.nav-child {
  display: flex;
  align-items: center;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}

.nav-child:hover { background: #f3f3f5; }

.nav-child--active {
  background: #ececf0;
  font-weight: 500;
}

/* ── Content area ─────────────────────────────────────────────────────────── */
.content-area {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.content-empty {
  min-height: 100vh;
}
</style>
