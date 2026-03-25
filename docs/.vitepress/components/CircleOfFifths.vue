<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudio } from '../composables/useAudio'
import { noteToMidi, midiToNote } from '../utils/music'

const { needsActivation, activate, playChord, playSequence } = useAudio()

// Circle of fifths: 12 major keys, clockwise from top (C)
const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm']

// Sharps/flats count for display
const KEY_SIGS: Record<string, string> = {
  'C': '', 'G': '1#', 'D': '2#', 'A': '3#', 'E': '4#', 'B': '5#', 'F#': '6#',
  'F': '1b', 'Bb': '2b', 'Eb': '3b', 'Ab': '4b', 'Db': '5b',
}

const CHORD_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
}

const selected = ref<number | null>(null)

const cx = 200
const cy = 200
const outerR = 160
const innerR = 105
const labelOuterR = 135
const labelInnerR = 82

function posAt(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

// Diatonic chords for the selected major key
const diatonicChords = computed(() => {
  if (selected.value === null) return null
  const root = MAJOR_KEYS[selected.value]
  const rootNote = root.replace('#', '#').replace('b', 'b')
  const rootMidi = noteToMidi(rootNote + '4')
  if (rootMidi === -1) return null

  const degrees = [
    { deg: 'I', offset: 0, type: 'major' as const },
    { deg: 'ii', offset: 2, type: 'minor' as const },
    { deg: 'iii', offset: 4, type: 'minor' as const },
    { deg: 'IV', offset: 5, type: 'major' as const },
    { deg: 'V', offset: 7, type: 'major' as const },
    { deg: 'vi', offset: 9, type: 'minor' as const },
  ]

  return degrees.map(d => {
    const chordRootMidi = rootMidi + d.offset
    const name = midiToNote(chordRootMidi).replace(/\d+/, '')
    const suffix = d.type === 'minor' ? 'm' : ''
    const notes = CHORD_INTERVALS[d.type].map(i => midiToNote(chordRootMidi + i))
    return { deg: d.deg, name: name + suffix, notes }
  })
})

// Highlight positions: selected key + its IV and V (neighbors on circle)
const highlightIdxs = computed(() => {
  if (selected.value === null) return new Set<number>()
  const s = selected.value
  const iv = (s + 11) % 12 // counterclockwise = IV
  const v = (s + 1) % 12   // clockwise = V
  return new Set([s, iv, v])
})

async function selectKey(idx: number) {
  if (needsActivation.value) await activate()
  selected.value = idx

  // Play the major chord of selected key
  const root = MAJOR_KEYS[idx]
  const rootMidi = noteToMidi(root.replace('b', 'b') + '4')
  if (rootMidi === -1) return
  const notes = CHORD_INTERVALS.major.map(i => midiToNote(rootMidi + i))
  playChord(notes, '2n')
}

async function playDiatonic(chord: { notes: string[] }) {
  if (needsActivation.value) await activate()
  playChord(chord.notes, '2n')
}

// SVG arc path for segments
function arcPath(startAngle: number, endAngle: number, r1: number, r2: number) {
  const a1 = ((startAngle - 90) * Math.PI) / 180
  const a2 = ((endAngle - 90) * Math.PI) / 180
  const x1o = cx + r1 * Math.cos(a1)
  const y1o = cy + r1 * Math.sin(a1)
  const x2o = cx + r1 * Math.cos(a2)
  const y2o = cy + r1 * Math.sin(a2)
  const x1i = cx + r2 * Math.cos(a2)
  const y1i = cy + r2 * Math.sin(a2)
  const x2i = cx + r2 * Math.cos(a1)
  const y2i = cy + r2 * Math.sin(a1)
  return `M ${x1o} ${y1o} A ${r1} ${r1} 0 0 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${r2} ${r2} 0 0 0 ${x2i} ${y2i} Z`
}
</script>

<template>
  <div class="demo-container circle-fifths">
    <div v-if="needsActivation" class="audio-banner" @click="activate">
      点击启用音频
    </div>

    <div class="circle-wrapper">
      <svg viewBox="0 0 400 400" class="circle-svg">
        <!-- Outer ring: major keys -->
        <g v-for="(key, i) in MAJOR_KEYS" :key="'M' + i">
          <path
            :d="arcPath(i * 30 - 15, i * 30 + 15, outerR + 26, innerR + 22)"
            :class="['segment-outer', { highlighted: highlightIdxs.has(i), selected: selected === i }]"
            @click="selectKey(i)"
          />
          <text
            :x="posAt(i * 30, labelOuterR).x"
            :y="posAt(i * 30, labelOuterR).y"
            class="key-label major-label"
            :class="{ active: selected === i }"
            @click="selectKey(i)"
          >{{ key }}</text>
          <text
            v-if="KEY_SIGS[key]"
            :x="posAt(i * 30, labelOuterR + 16).x"
            :y="posAt(i * 30, labelOuterR + 16).y"
            class="sig-label"
          >{{ KEY_SIGS[key] }}</text>
        </g>

        <!-- Inner ring: minor keys -->
        <g v-for="(key, i) in MINOR_KEYS" :key="'m' + i">
          <path
            :d="arcPath(i * 30 - 15, i * 30 + 15, innerR + 18, innerR - 36)"
            :class="['segment-inner', { highlighted: highlightIdxs.has(i) }]"
          />
          <text
            :x="posAt(i * 30, labelInnerR).x"
            :y="posAt(i * 30, labelInnerR).y"
            class="key-label minor-label"
          >{{ key }}</text>
        </g>

        <!-- Center -->
        <circle :cx="cx" :cy="cy" r="34" class="center-circle" />
        <text :x="cx" :y="cy - 6" class="center-text">五度圈</text>
        <text :x="cx" :y="cy + 12" class="center-sub">Circle of 5ths</text>
      </svg>
    </div>

    <!-- Diatonic chords panel -->
    <div v-if="diatonicChords" class="diatonic-panel">
      <p class="panel-title">{{ MAJOR_KEYS[selected!] }} 大调 — 自然和弦</p>
      <div class="diatonic-chords">
        <button
          v-for="ch in diatonicChords"
          :key="ch.deg"
          class="diatonic-btn"
          @click="playDiatonic(ch)"
        >
          <span class="dia-deg">{{ ch.deg }}</span>
          <span class="dia-name">{{ ch.name }}</span>
        </button>
      </div>
    </div>

    <p v-else class="hint">点击外圈的调名，查看自然和弦</p>
  </div>
</template>

<style scoped>
.circle-fifths {
  padding: 20px;
}

.circle-wrapper {
  max-width: 380px;
  margin: 0 auto 16px;
}

.circle-svg {
  width: 100%;
  height: auto;
}

.segment-outer {
  fill: var(--vp-c-bg-soft);
  stroke: var(--vp-c-divider);
  stroke-width: 1;
  cursor: pointer;
  transition: fill 0.2s;
}

.segment-outer:hover {
  fill: var(--vp-c-brand-soft);
}

.segment-outer.highlighted {
  fill: var(--vp-c-brand-soft);
}

.segment-outer.selected {
  fill: var(--vp-c-brand-1);
}

.segment-inner {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-divider);
  stroke-width: 1;
  transition: fill 0.2s;
}

.segment-inner.highlighted {
  fill: rgba(139, 92, 246, 0.15);
}

.key-label {
  text-anchor: middle;
  dominant-baseline: central;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  pointer-events: none;
  fill: var(--vp-c-text-1);
}

.key-label.active {
  fill: #fff;
}

.minor-label {
  font-size: 11px;
  font-weight: 500;
  fill: var(--vp-c-text-2);
  cursor: default;
}

.sig-label {
  text-anchor: middle;
  dominant-baseline: central;
  font-size: 9px;
  fill: var(--vp-c-text-3);
  pointer-events: none;
}

.center-circle {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
}

.center-text {
  text-anchor: middle;
  dominant-baseline: central;
  font-size: 13px;
  font-weight: 700;
  fill: var(--vp-c-text-1);
}

.center-sub {
  text-anchor: middle;
  dominant-baseline: central;
  font-size: 8px;
  fill: var(--vp-c-text-3);
}

.diatonic-panel {
  text-align: center;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--vp-c-text-1);
}

.diatonic-chords {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.diatonic-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 14px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.diatonic-btn:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.dia-deg {
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  font-family: serif;
}

.dia-name {
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
}

.hint {
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

@media (max-width: 640px) {
  .circle-wrapper {
    max-width: 320px;
  }
}
</style>
