<template>
  <div class="page">
    <div class="content">

      <h1>Operational Sheets</h1>

      <div class="sections">

        <!-- ── Location Selection ────────────────────────────────────── -->
        <div class="section">
          <label class="section-label">Location</label>

          <div class="loc-wrap" ref="locationPopoverRef">
            <button class="loc-trigger" @click="locationOpen = !locationOpen">
              <svg class="pin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {{ locationTriggerLabel }}
            </button>

            <div v-if="locationOpen" class="loc-popover">
              <div class="loc-search-wrap">
                <input
                  type="text"
                  class="loc-search"
                  placeholder="Search locations..."
                  v-model="locationSearch"
                  @click.stop
                />
              </div>
              <div class="loc-list">
                <label
                  v-for="loc in filteredLocations"
                  :key="loc.id"
                  class="loc-item"
                >
                  <input
                    type="checkbox"
                    class="loc-check"
                    :value="loc.id"
                    v-model="selectedLocationIds"
                    @click.stop
                  />
                  <span class="loc-name">{{ loc.name }}</span>
                </label>
              </div>
              <div class="loc-footer">
                <button class="loc-clear" @click.stop="selectedLocationIds = []; locationSearch = ''">Clear</button>
              </div>
            </div>
          </div>
        </div>

        <div class="sep"></div>

        <!-- ── Date Selection ─────────────────────────────────────────── -->
        <div class="section">
          <label class="section-label">Date Selection</label>

          <div class="preset-row">
            <button
              v-for="p in DATE_PRESETS"
              :key="p.id"
              class="btn-outline"
              :class="{ active: activePreset === p.id }"
              @click="applyPreset(p.id)"
            >{{ p.label }}</button>

            <!-- Custom Range with popover -->
            <div class="popover-wrap" ref="popoverRef">
              <button
                class="btn-outline"
                :class="{ active: activePreset === 'custom' }"
                @click="toggleCustomPicker"
              >
                <svg class="cal-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                Custom Range
              </button>

              <div v-if="calendarOpen" class="popover">
                <!-- Mode selector -->
                <div class="mode-row">
                  <button
                    v-for="m in DATE_MODES"
                    :key="m.id"
                    class="mode-btn"
                    :class="{ active: dateMode === m.id }"
                    @click="setDateMode(m.id)"
                  >{{ m.label }}</button>
                </div>
                <div class="popover-sep"></div>
                <!-- Inline calendar -->
                <VueDatePicker
                  v-if="dateMode === 'single'"
                  v-model="singleDate"
                  :enable-time-picker="false"
                  auto-apply
                  inline
                  :dark="false"
                  @update:model-value="onSinglePick"
                />
                <VueDatePicker
                  v-else-if="dateMode === 'range'"
                  v-model="rangeDate"
                  range
                  :enable-time-picker="false"
                  auto-apply
                  inline
                  :dark="false"
                  @update:model-value="onRangePick"
                />
                <VueDatePicker
                  v-else
                  v-model="multipleDates"
                  multi-dates
                  :enable-time-picker="false"
                  auto-apply
                  inline
                  :dark="false"
                />
              </div>
            </div>
          </div>

          <p class="selected-text">Selected: {{ dateSummaryText }}</p>
        </div>

        <div class="sep"></div>

        <!-- ── Time Selection ─────────────────────────────────────────── -->
        <div class="section">
          <label class="section-label">Time Selection</label>

          <div class="sub-section">
            <p class="sub-label">Service Periods</p>
            <div class="toggle-group">
              <button
                v-for="(meta, key) in SERVICE_PERIODS"
                :key="key"
                class="toggle-item"
                :class="{ active: selectedPeriods.includes(key as ServicePeriod) }"
                @click="togglePeriod(key as ServicePeriod)"
              >{{ meta.label }}</button>
            </div>
          </div>

          <div class="sub-section">
            <p class="sub-label">Custom Time Range</p>
            <div class="time-row">
              <input
                type="time"
                v-model="customTimeFrom"
                class="time-input"
                :disabled="selectedPeriods.length > 0"
              />
              <span class="to-text">to</span>
              <input
                type="time"
                v-model="customTimeTo"
                class="time-input"
                :disabled="selectedPeriods.length > 0"
              />
            </div>
          </div>
        </div>

        <div class="sep"></div>

        <!-- ── Production Scope ───────────────────────────────────────── -->
        <div class="scope-box">
          <p class="scope-box-label">Production Scope</p>
          <p class="scope-box-value">{{ scopeSummaryText }}</p>
        </div>

        <!-- ── Generate CTA ───────────────────────────────────────────── -->
        <div class="cta-row">
          <button class="btn-secondary" @click="generate('pack')">
            Generate Pack Sheet
          </button>
          <button class="btn-primary" @click="generate('production')">
            Generate Production Sheet
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { SERVICE_PERIODS, LOCATIONS } from '../data/mock'
import type { ServicePeriod } from '../data/mock'
import type { Scope } from '../types'

// ── Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  generate: [scope: Scope]
}>()

// ── Preset config ──────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { id: 'today',          label: 'Today' },
  { id: 'tomorrow',       label: 'Tomorrow' },
  { id: 'today-tomorrow', label: 'Today + Tomorrow' },
  { id: 'this-week',      label: 'This Week' },
  { id: 'next-7',         label: 'Next 7 Days' },
] as const

const DATE_MODES = [
  { id: 'single',   label: 'Single' },
  { id: 'range',    label: 'Range' },
] as const

type DateMode = typeof DATE_MODES[number]['id'] | 'multiple'

// ── Date state ─────────────────────────────────────────────────────────────

const activePreset  = ref<string>('today')
const calendarOpen  = ref(false)
const dateMode      = ref<DateMode>('range')
const singleDate    = ref<Date | null>(null)
const rangeDate     = ref<Date[] | null>(null)
const multipleDates = ref<Date[]>([])
const popoverRef    = ref<HTMLElement | null>(null)

const effectiveDateRange = computed<[Date, Date]>(() => {
  if (activePreset.value !== 'custom') {
    return computePresetRange(activePreset.value)
  }
  if (dateMode.value === 'single' && singleDate.value) {
    const d = startOfDay(singleDate.value)
    return [d, d]
  }
  if (dateMode.value === 'range' && rangeDate.value?.length === 2) {
    return [startOfDay(rangeDate.value[0]), startOfDay(rangeDate.value[1])]
  }
  if (dateMode.value === 'multiple' && multipleDates.value.length > 0) {
    const sorted = [...multipleDates.value].sort((a, b) => a.getTime() - b.getTime())
    return [startOfDay(sorted[0]), startOfDay(sorted[sorted.length - 1])]
  }
  const today = startOfDay(new Date())
  return [today, today]
})

function toggleCustomPicker() {
  calendarOpen.value = !calendarOpen.value
  if (calendarOpen.value) activePreset.value = 'custom'
}

function onSinglePick() { calendarOpen.value = false }
function onRangePick(val: Date[] | null) {
  if (val?.length === 2 && val[1]) calendarOpen.value = false
}

function setDateMode(mode: DateMode) {
  dateMode.value = mode
  singleDate.value = null
  rangeDate.value = null
  multipleDates.value = []
}

function applyPreset(id: string) {
  activePreset.value = id
  calendarOpen.value = false
}

// Close popovers when clicking outside
function handleOutsideClick(e: Event) {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    calendarOpen.value = false
  }
  if (locationPopoverRef.value && !locationPopoverRef.value.contains(e.target as Node)) {
    locationOpen.value = false
  }
}
onMounted(()  => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

// ── Time / service period state ────────────────────────────────────────────

const selectedPeriods = ref<ServicePeriod[]>([])
const customTimeFrom  = ref('')
const customTimeTo    = ref('')

function togglePeriod(p: ServicePeriod) {
  const idx = selectedPeriods.value.indexOf(p)
  if (idx === -1) selectedPeriods.value.push(p)
  else selectedPeriods.value.splice(idx, 1)
}

// ── Location state ─────────────────────────────────────────────────────────

const selectedLocationIds = ref<string[]>([])
const locationSearch      = ref('')
const locationOpen        = ref(false)
const locationPopoverRef  = ref<HTMLElement | null>(null)

const filteredLocations = computed(() =>
  LOCATIONS.filter(l =>
    l.name.toLowerCase().includes(locationSearch.value.toLowerCase())
  )
)

const locationTriggerLabel = computed(() => {
  const n = selectedLocationIds.value.length
  return n === 0 ? 'All Locations' : `${n} Location${n > 1 ? 's' : ''}`
})

// ── Summary labels ─────────────────────────────────────────────────────────

const dateSummaryText = computed<string>(() => {
  const [from, to] = effectiveDateRange.value
  if (activePreset.value !== 'custom') {
    if (from.getTime() === to.getTime()) return formatLongDate(from)
    return `${formatShortDate(from)} – ${formatShortDate(to)}`
  }
  if (dateMode.value === 'multiple' && multipleDates.value.length > 1) {
    return multipleDates.value.map(d => formatShortDate(d)).join(', ')
  }
  if (from.getTime() === to.getTime()) return formatLongDate(from)
  return `${formatShortDate(from)} – ${formatShortDate(to)}`
})

const timeSummaryText = computed<string>(() => {
  if (selectedPeriods.value.length > 0) {
    return selectedPeriods.value.map(p => SERVICE_PERIODS[p].label).join(', ')
  }
  if (customTimeFrom.value && customTimeTo.value) {
    return `${formatTime12(customTimeFrom.value)} – ${formatTime12(customTimeTo.value)}`
  }
  return 'All day'
})

const locationSummaryText = computed<string>(() => {
  const n = selectedLocationIds.value.length
  if (n === 0) return 'All locations'
  return selectedLocationIds.value
    .map(id => LOCATIONS.find(l => l.id === id)?.name ?? id)
    .join(', ')
})

const scopeSummaryText = computed<string>(() =>
  `${dateSummaryText.value} • ${timeSummaryText.value} • ${locationSummaryText.value}`
)

// ── Generate ───────────────────────────────────────────────────────────────

function generate(sheetType: 'production' | 'pack') {
  const [from, to] = effectiveDateRange.value
  const n = selectedLocationIds.value.length
  const locationLabel = n === 0
    ? 'All Locations'
    : selectedLocationIds.value
        .map(id => LOCATIONS.find(l => l.id === id)?.name ?? id)
        .join(', ')

  const scope: Scope = {
    dateRange: [from, to],
    servicePeriods: [...selectedPeriods.value],
    customTimeFrom: selectedPeriods.value.length === 0 ? customTimeFrom.value : '',
    customTimeTo:   selectedPeriods.value.length === 0 ? customTimeTo.value : '',
    locationIds: [...selectedLocationIds.value],
    dateLabel: dateSummaryText.value,
    timeLabel: timeSummaryText.value,
    locationLabel,
    summary: scopeSummaryText.value,
    generatedAt: new Date(),
    sheetType,
  }
  emit('generate', scope)
}

// ── Date utilities ─────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const n = new Date(d); n.setHours(0, 0, 0, 0); return n
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function startOfWeek(d: Date): Date {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r
}
function endOfWeek(d: Date): Date {
  const r = new Date(d); r.setDate(r.getDate() + (6 - r.getDay())); r.setHours(0,0,0,0); return r
}
function computePresetRange(preset: string): [Date, Date] {
  const today = startOfDay(new Date())
  switch (preset) {
    case 'today':          return [today, today]
    case 'tomorrow':       return [addDays(today, 1), addDays(today, 1)]
    case 'today-tomorrow': return [today, addDays(today, 1)]
    case 'this-week':      return [startOfWeek(today), endOfWeek(today)]
    case 'next-7':         return [today, addDays(today, 6)]
    default:               return [today, today]
  }
}

const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function formatLongDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
function formatShortDate(d: Date): string {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}
function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mStr || '00'} ${period}`
}
</script>

<!-- Global: shared tokens + VueDatePicker overrides -->
<style>
@import '@vuepic/vue-datepicker/dist/main.css';

/* ── Figma/shadcn design tokens ── */
:root {
  --fg:          #030213;
  --muted-fg:    #717182;
  --border:      rgba(0, 0, 0, 0.1);
  --input-bg:    #f3f3f5;
  --accent:      #e9ebef;
  --muted:       #ececf0;
  --radius:      0.625rem;

  /* Tokens kept for SheetView compatibility */
  --paper:       #f5f0e8;
  --paper2:      #ede8df;
  --paper3:      #e4dfd5;
  --ink:         #1a1612;
  --ink2:        #4a453e;
  --ink3:        #8a857e;
  --rule:        #c8c2b8;
  --rule2:       #b0a898;
  --red-stamp:   #c0261a;
  --red-dim:     rgba(192, 38, 26, 0.08);
  --amber-stamp: #b86a00;
  --amber-dim:   rgba(184, 106, 0, 0.08);
  --mono:        'IBM Plex Mono', monospace;
  --serif:       'Libre Baskerville', serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  background: #fff;
  color: #030213;
  -webkit-font-smoothing: antialiased;
}

/* VueDatePicker — neutral theme to match shadcn */
:root {
  --dp-font-family: system-ui, -apple-system, sans-serif;
  --dp-font-size: 14px;
  --dp-cell-border-radius: calc(var(--radius) - 4px);
  --dp-background-color: #fff;
  --dp-text-color: #030213;
  --dp-hover-color: #e9ebef;
  --dp-hover-text-color: #030213;
  --dp-primary-color: #030213;
  --dp-primary-text-color: #fff;
  --dp-secondary-color: #ececf0;
  --dp-border-color: rgba(0, 0, 0, 0.1);
  --dp-menu-border-color: rgba(0, 0, 0, 0.1);
  --dp-border-color-hover: rgba(0, 0, 0, 0.2);
  --dp-icon-color: #717182;
  --dp-highlight-color: rgba(3, 2, 19, 0.06);
}

.dp__menu { border-radius: var(--radius) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
.dp__calendar_header_item { font-size: 11px !important; font-weight: 600 !important; color: #717182 !important; }
.dp__month_year_select { font-weight: 600 !important; }
.dp__today { border: 1px solid rgba(0,0,0,0.2) !important; }
.dp__active_date { border-radius: calc(var(--radius) - 4px) !important; }
.dp__menu { border: 1px solid rgba(0,0,0,0.1) !important; }
</style>

<!-- Scoped: scope selector layout -->
<style scoped>
/* ── Page shell ──────────────────────────────────────────────────────────── */
.page {
  min-height: 100vh;
  background: #fff;
  padding: 32px;
}

.content {
  max-width: 896px;
  margin: 0 auto;
}

/* ── Title ───────────────────────────────────────────────────────────────── */
h1 {
  font-size: 1.875rem;  /* 30px */
  font-weight: 600;
  color: #030213;
  letter-spacing: -0.025em;
  margin-bottom: 2rem;
}

/* ── Sections container ──────────────────────────────────────────────────── */
.sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;  /* space-y-8 equivalent */
}

/* ── Individual section ──────────────────────────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;  /* space-y-4 */
}

.section-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #030213;
}

/* ── Horizontal separator ────────────────────────────────────────────────── */
.sep {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

/* ── Preset buttons row ──────────────────────────────────────────────────── */
.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;  /* gap-2 */
  align-items: center;
}

/* ── Outline button (preset + custom range) ──────────────────────────────── */
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 2rem;              /* h-8 / size="sm" */
  padding: 0 0.75rem;        /* px-3 */
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: calc(var(--radius) - 2px);  /* rounded-md */
  background: #fff;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;        /* text-sm */
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}

.btn-outline:hover { background: #e9ebef; }

.btn-outline.active {
  background: #030213;
  color: #fff;
  border-color: #030213;
}

.cal-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ── Custom range popover ────────────────────────────────────────────────── */
.popover-wrap {
  position: relative;
}

.popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 0.75rem;
  width: auto;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mode-row {
  display: flex;
  gap: 0.375rem;
}

.mode-btn {
  flex: 1;
  height: 2rem;
  padding: 0 0.75rem;
  border: none;
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  color: #717182;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.mode-btn:hover { background: #e9ebef; color: #030213; }
.mode-btn.active { background: #030213; color: #fff; }

.popover-sep {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

/* ── Selected date text ──────────────────────────────────────────────────── */
.selected-text {
  font-size: 0.875rem;
  color: #717182;
}

/* ── Sub-section (inside Time Selection) ────────────────────────────────── */
.sub-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sub-label {
  font-size: 0.875rem;
  color: #717182;
}

/* ── Service period toggle group ─────────────────────────────────────────── */
.toggle-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;  /* gap-1 */
}

.toggle-item {
  height: 2.25rem;      /* h-9 */
  padding: 0 0.75rem;   /* px-3 */
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}

.toggle-item:hover { background: #e9ebef; }

.toggle-item.active {
  background: #e9ebef;
  color: #030213;
  border-color: rgba(0, 0, 0, 0.15);
}

/* ── Custom time range inputs ────────────────────────────────────────────── */
.time-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-input {
  width: 10rem;           /* w-40 */
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: calc(var(--radius) - 2px);
  background: #f3f3f5;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.1s;
}

.time-input:focus { border-color: rgba(0, 0, 0, 0.3); }
.time-input:disabled { opacity: 0.5; cursor: not-allowed; }

.to-text {
  font-size: 0.875rem;
  color: #717182;
}

/* ── Production Scope box ────────────────────────────────────────────────── */
.scope-box {
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(236, 236, 240, 0.3);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scope-box-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #717182;
}

.scope-box-value {
  font-size: 1rem;
  color: #030213;
  font-weight: 400;
}

/* ── Generate CTA ────────────────────────────────────────────────────────── */
.cta-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

.btn-primary {
  height: 2.75rem;
  padding: 0 2rem;
  background: #030213;
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.1s;
}

.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
  height: 2.75rem;
  padding: 0 2rem;
  background: #fff;
  color: #030213;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s, border-color 0.1s;
}

.btn-secondary:hover {
  background: #e9ebef;
  border-color: rgba(0, 0, 0, 0.25);
}

/* ── Location selector ────────────────────────────────────────────────────── */
.loc-wrap {
  position: relative;
  display: inline-block;
}

.loc-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 1rem;
  background: #f3f3f5;
  border: none;
  border-radius: 9999px;     /* pill shape */
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;
}

.loc-trigger:hover { background: #e9ebef; }

.pin-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: #717182;
}

/* ── Popover ─────────────────────────────────────────────────────────────── */
.loc-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 60;
  width: 300px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ── Search input ────────────────────────────────────────────────────────── */
.loc-search-wrap {
  padding: 10px 10px 0;
}

.loc-search {
  width: 100%;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.5rem;
  background: #fff;
  color: #030213;
  font-family: inherit;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.loc-search:focus {
  border-color: #2563eb;
}

.loc-search::placeholder {
  color: #b0b0b8;
}

/* ── Location list ───────────────────────────────────────────────────────── */
.loc-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 0;
}

.loc-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
}

.loc-item:hover {
  background: #f5f5f7;
}

.loc-check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: #3a7d44;
  border-radius: 4px;
}

.loc-name {
  font-size: 0.9375rem;
  color: #030213;
  line-height: 1.3;
}

/* ── Footer / clear ──────────────────────────────────────────────────────── */
.loc-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 2px 0;
}

.loc-clear {
  display: block;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: none;
  color: #030213;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 400;
  cursor: pointer;
  text-align: center;
  transition: background 0.1s;
}

.loc-clear:hover { background: #f5f5f7; }
</style>
