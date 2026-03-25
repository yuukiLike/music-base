<script setup lang="ts">
import { ref, computed } from 'vue'
import * as Tone from 'tone'
import { useAudio } from '../composables/useAudio'

const { needsActivation, activate, playNote } = useAudio()

const TOTAL_BEATS = 8
const PITCHES = ['G4', 'F4', 'E4', 'D4', 'C4']
const CELL_W = 56
const CELL_H = 36
const LABEL_W = 36

interface EventBlock {
  pitch: string
  start: number
  id: number
}

let nextId = 0
const events = ref<EventBlock[]>([
  { pitch: 'C4', start: 0, id: nextId++ },
  { pitch: 'E4', start: 2, id: nextId++ },
  { pitch: 'G4', start: 4, id: nextId++ },
  { pitch: 'C4', start: 6, id: nextId++ },
])

const playing = ref(false)
const playheadBeat = ref(-1)

function toggleCell(pitch: string, beat: number) {
  const idx = events.value.findIndex(e => e.pitch === pitch && e.start === beat)
  if (idx >= 0) {
    events.value.splice(idx, 1)
  } else {
    events.value.push({ pitch, start: beat, id: nextId++ })
  }
}

function isActive(pitch: string, beat: number): boolean {
  return events.value.some(e => e.pitch === pitch && e.start === beat)
}

function isPlaying(beat: number): boolean {
  return playheadBeat.value === beat
}

const jsonPreview = computed(() => {
  const sorted = [...events.value].sort((a, b) => a.start - b.start || PITCHES.indexOf(a.pitch) - PITCHES.indexOf(b.pitch))
  return sorted.map(e => ({
    pitch: e.pitch,
    start: e.start,
    duration: 1,
    velocity: 90,
  }))
})

async function play() {
  if (playing.value) return

  if (needsActivation.value) {
    await activate()
  }

  playing.value = true
  const bpm = 140
  const beatMs = 60 / bpm * 1000

  for (let beat = 0; beat < TOTAL_BEATS; beat++) {
    if (!playing.value) break
    playheadBeat.value = beat

    const notesAtBeat = events.value.filter(e => e.start === beat)
    const now = Tone.now()
    for (const n of notesAtBeat) {
      playNote(n.pitch, now, 60 / bpm * 0.8)
    }

    await new Promise(r => setTimeout(r, beatMs))
  }

  playing.value = false
  playheadBeat.value = -1
}

function stop() {
  playing.value = false
  playheadBeat.value = -1
}

function clear() {
  events.value = []
}
</script>

<template>
  <div class="demo-container">
    <div v-if="needsActivation && !playing" class="audio-banner" @click="play">
      点击启用音频 🔊
    </div>

    <div class="demo-controls">
      <button @click="play" :disabled="playing">▶ 播放</button>
      <button @click="stop" v-if="playing">⏹ 停止</button>
      <button @click="clear" class="clear-btn">清空</button>
      <span class="hint">点击格子放置声音事件</span>
    </div>

    <!-- Grid -->
    <div class="timeline-grid">
      <!-- Beat numbers row -->
      <div class="grid-header">
        <div class="label-cell" />
        <div
          v-for="b in TOTAL_BEATS"
          :key="'h' + b"
          class="header-cell"
          :class="{ 'playhead-col': isPlaying(b - 1) }"
        >{{ b - 1 }}</div>
      </div>

      <!-- Pitch rows -->
      <div v-for="pitch in PITCHES" :key="pitch" class="grid-row">
        <div class="label-cell">{{ pitch }}</div>
        <div
          v-for="b in TOTAL_BEATS"
          :key="pitch + b"
          class="grid-cell"
          :class="{
            active: isActive(pitch, b - 1),
            'playhead-col': isPlaying(b - 1),
            'playing-active': isActive(pitch, b - 1) && isPlaying(b - 1),
          }"
          @click="toggleCell(pitch, b - 1)"
        >
          <div v-if="isActive(pitch, b - 1)" class="event-dot" />
        </div>
      </div>

      <!-- Time axis label -->
      <div class="time-axis">
        <div class="label-cell" />
        <div class="axis-label">时间 (拍) →</div>
      </div>
    </div>

    <!-- JSON preview -->
    <div class="json-mini">
      <div class="json-mini-header">
        事件数据 · {{ jsonPreview.length }} 个事件
      </div>
      <pre class="json-mini-body">{{ JSON.stringify(jsonPreview, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.clear-btn {
  background: var(--vp-c-bg) !important;
  color: var(--vp-c-text-2) !important;
  border-color: var(--vp-c-divider) !important;
}

.timeline-grid {
  margin: 12px 0;
  user-select: none;
}

.grid-header, .grid-row {
  display: flex;
  gap: 2px;
}

.grid-header {
  margin-bottom: 2px;
}

.label-cell {
  width: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.header-cell {
  width: 56px;
  text-align: center;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  padding: 2px 0;
  border-radius: 4px;
  transition: background 0.1s;
}

.header-cell.playhead-col {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.grid-cell {
  width: 56px;
  height: 36px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s;
  background: var(--vp-c-bg);
}

.grid-cell:hover {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-brand-soft);
}

.grid-cell.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.grid-cell.playhead-col {
  box-shadow: inset 0 0 0 1px var(--vp-c-brand-soft);
}

.grid-cell.playing-active {
  background: var(--vp-c-brand-3, #7694e8);
  transform: scale(1.08);
  box-shadow: 0 0 12px var(--vp-c-brand-soft);
}

.grid-row {
  margin-bottom: 2px;
}

.event-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.1s;
}

.playing-active .event-dot {
  transform: scale(1.3);
}

.time-axis {
  display: flex;
  margin-top: 4px;
}

.axis-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  padding-left: 4px;
}

/* JSON mini panel */
.json-mini {
  margin-top: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.json-mini-header {
  padding: 6px 12px;
  background: var(--vp-c-bg-soft);
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
  border-bottom: 1px solid var(--vp-c-divider);
}

.json-mini-body {
  padding: 8px 12px;
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  max-height: 160px;
  overflow-y: auto;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .grid-cell, .header-cell {
    width: 40px;
  }
  .grid-cell {
    height: 32px;
  }
}
</style>
