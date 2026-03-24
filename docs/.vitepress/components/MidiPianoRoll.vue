<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import * as Tone from 'tone'
import { useAudio } from '../composables/useAudio'

interface MidiEvent {
  pitch: string
  start: number
  duration: number
  velocity: number
}

const SONGS: { name: string; bpm: number; events: MidiEvent[] }[] = [
  {
    name: '小星星 (Twinkle Twinkle)',
    bpm: 110,
    events: [
      { pitch: 'C4', start: 0, duration: 1, velocity: 90 },
      { pitch: 'C4', start: 1, duration: 1, velocity: 85 },
      { pitch: 'G4', start: 2, duration: 1, velocity: 95 },
      { pitch: 'G4', start: 3, duration: 1, velocity: 90 },
      { pitch: 'A4', start: 4, duration: 1, velocity: 95 },
      { pitch: 'A4', start: 5, duration: 1, velocity: 90 },
      { pitch: 'G4', start: 6, duration: 2, velocity: 85 },
      { pitch: 'F4', start: 8, duration: 1, velocity: 90 },
      { pitch: 'F4', start: 9, duration: 1, velocity: 85 },
      { pitch: 'E4', start: 10, duration: 1, velocity: 90 },
      { pitch: 'E4', start: 11, duration: 1, velocity: 85 },
      { pitch: 'D4', start: 12, duration: 1, velocity: 90 },
      { pitch: 'D4', start: 13, duration: 1, velocity: 85 },
      { pitch: 'C4', start: 14, duration: 2, velocity: 95 },
    ],
  },
  {
    name: '简单和弦进行 (C-F-G-C)',
    bpm: 90,
    events: [
      // C chord
      { pitch: 'C4', start: 0, duration: 2, velocity: 85 },
      { pitch: 'E4', start: 0, duration: 2, velocity: 75 },
      { pitch: 'G4', start: 0, duration: 2, velocity: 75 },
      // F chord
      { pitch: 'F3', start: 2, duration: 2, velocity: 85 },
      { pitch: 'A3', start: 2, duration: 2, velocity: 75 },
      { pitch: 'C4', start: 2, duration: 2, velocity: 75 },
      // G chord
      { pitch: 'G3', start: 4, duration: 2, velocity: 90 },
      { pitch: 'B3', start: 4, duration: 2, velocity: 75 },
      { pitch: 'D4', start: 4, duration: 2, velocity: 75 },
      // C chord
      { pitch: 'C4', start: 6, duration: 2, velocity: 95 },
      { pitch: 'E4', start: 6, duration: 2, velocity: 80 },
      { pitch: 'G4', start: 6, duration: 2, velocity: 80 },
    ],
  },
]

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function pitchToMidi(pitch: string): number {
  const match = pitch.match(/^([A-G]#?)(\d+)$/)
  if (!match) return 60
  const note = NOTE_NAMES.indexOf(match[1])
  const octave = parseInt(match[2], 10)
  return (octave + 1) * 12 + note
}

const { needsActivation, activate, playNote } = useAudio()

const selectedSong = ref(0)
const playing = ref(false)
const playheadPos = ref(0)
const activeNotes = ref<Set<number>>(new Set())

const song = computed(() => SONGS[selectedSong.value])

const totalBeats = computed(() => {
  let max = 0
  for (const e of song.value.events) {
    max = Math.max(max, e.start + e.duration)
  }
  return max
})

// Compute pitch range
const pitchRange = computed(() => {
  let min = 127, max = 0
  for (const e of song.value.events) {
    const midi = pitchToMidi(e.pitch)
    min = Math.min(min, midi)
    max = Math.max(max, midi)
  }
  return { min: min - 1, max: max + 1 }
})

const rowCount = computed(() => pitchRange.value.max - pitchRange.value.min + 1)

// SVG dimensions
const BEAT_WIDTH = 60
const ROW_HEIGHT = 20
const PIANO_WIDTH = 48

const svgWidth = computed(() => PIANO_WIDTH + totalBeats.value * BEAT_WIDTH + 20)
const svgHeight = computed(() => rowCount.value * ROW_HEIGHT)

function midiToRow(midi: number): number {
  return pitchRange.value.max - midi
}

function midiToLabel(midi: number): string {
  return NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1)
}

function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(midi % 12)
}

// Note blocks for SVG
const noteBlocks = computed(() => {
  return song.value.events.map((e, i) => {
    const midi = pitchToMidi(e.pitch)
    return {
      x: PIANO_WIDTH + e.start * BEAT_WIDTH,
      y: midiToRow(midi) * ROW_HEIGHT,
      width: e.duration * BEAT_WIDTH - 2,
      height: ROW_HEIGHT - 2,
      opacity: 0.5 + (e.velocity / 127) * 0.5,
      event: e,
      index: i,
      midi,
    }
  })
})

// Piano keys for left side
const pianoKeys = computed(() => {
  const keys = []
  for (let midi = pitchRange.value.max; midi >= pitchRange.value.min; midi--) {
    keys.push({
      midi,
      label: midiToLabel(midi),
      isBlack: isBlackKey(midi),
      y: midiToRow(midi) * ROW_HEIGHT,
    })
  }
  return keys
})

// Grid lines
const beatLines = computed(() => {
  const lines = []
  for (let b = 0; b <= totalBeats.value; b++) {
    lines.push({
      x: PIANO_WIDTH + b * BEAT_WIDTH,
      isMeasure: b % 4 === 0,
      label: b % 4 === 0 ? `${Math.floor(b / 4) + 1}` : '',
    })
  }
  return lines
})

// Playback
let animFrame = 0
let startTime = 0
let visualTimers: number[] = []

async function togglePlay() {
  if (playing.value) {
    stopPlay()
    return
  }

  if (needsActivation.value) {
    await activate()
  }

  playing.value = true
  playheadPos.value = 0
  activeNotes.value = new Set()
  visualTimers = []

  const beatDuration = 60 / song.value.bpm
  const totalDuration = totalBeats.value * beatDuration

  // Schedule notes and visual highlights via setTimeout
  song.value.events.forEach((e, i) => {
    const startMs = e.start * beatDuration * 1000
    const durMs = e.duration * beatDuration * 1000

    // Visual: highlight on
    const onTimer = window.setTimeout(() => {
      activeNotes.value.add(i)
    }, startMs)

    // Visual: highlight off
    const offTimer = window.setTimeout(() => {
      activeNotes.value.delete(i)
    }, startMs + durMs)

    visualTimers.push(onTimer, offTimer)

    // Audio: schedule with Tone.js for precise timing
    const noteStartSec = Tone.now() + 0.05 + e.start * beatDuration
    const noteDurSec = e.duration * beatDuration
    playNote(e.pitch, noteStartSec, noteDurSec)
  })

  // Animate playhead
  startTime = performance.now()
  const totalMs = totalDuration * 1000

  function animate(timestamp: number) {
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / totalMs, 1)
    playheadPos.value = progress * totalBeats.value

    if (progress < 1 && playing.value) {
      animFrame = requestAnimationFrame(animate)
    } else if (playing.value) {
      stopPlay()
    }
  }

  animFrame = requestAnimationFrame(animate)
}

function stopPlay() {
  playing.value = false
  cancelAnimationFrame(animFrame)
  activeNotes.value = new Set()
  visualTimers.forEach(t => clearTimeout(t))
  visualTimers = []
}

// Current event for JSON panel
const currentEventIndex = computed(() => {
  const pos = playheadPos.value
  for (let i = song.value.events.length - 1; i >= 0; i--) {
    const e = song.value.events[i]
    if (pos >= e.start && pos < e.start + e.duration) return i
  }
  return -1
})

onUnmounted(() => {
  stopPlay()
})
</script>

<template>
  <div class="demo-container midi-roll-container">
    <div v-if="needsActivation && !playing" class="audio-banner" @click="togglePlay">
      点击启用音频 🔊
    </div>

    <div class="demo-controls">
      <label>
        曲目：
        <select v-model.number="selectedSong" @change="stopPlay">
          <option v-for="(s, i) in SONGS" :key="i" :value="i">{{ s.name }}</option>
        </select>
      </label>
      <span class="bpm-display">{{ song.bpm }} BPM</span>
      <button @click="togglePlay">{{ playing ? '⏹ 停止' : '▶ 播放' }}</button>
    </div>

    <!-- Piano Roll -->
    <div class="roll-viewport">
      <svg :viewBox="`0 0 ${svgWidth} ${svgHeight + 24}`" :width="svgWidth" class="roll-svg">
        <!-- Background rows -->
        <rect
          v-for="key in pianoKeys"
          :key="'bg' + key.midi"
          :x="PIANO_WIDTH"
          :y="key.y"
          :width="svgWidth - PIANO_WIDTH"
          :height="ROW_HEIGHT"
          :fill="key.isBlack ? 'var(--roll-black-row)' : 'var(--roll-white-row)'"
        />

        <!-- Beat grid lines -->
        <line
          v-for="(line, i) in beatLines"
          :key="'line' + i"
          :x1="line.x" :y1="0"
          :x2="line.x" :y2="svgHeight"
          :stroke="line.isMeasure ? 'var(--roll-measure-line)' : 'var(--roll-beat-line)'"
          :stroke-width="line.isMeasure ? 1.5 : 0.5"
        />

        <!-- Beat labels -->
        <text
          v-for="(line, i) in beatLines"
          :key="'label' + i"
          v-show="line.label"
          :x="line.x + 4"
          :y="svgHeight + 16"
          class="beat-label-text"
        >{{ line.label }}</text>

        <!-- Note blocks -->
        <rect
          v-for="block in noteBlocks"
          :key="'note' + block.index"
          :x="block.x + 1"
          :y="block.y + 1"
          :width="block.width"
          :height="block.height"
          :opacity="block.opacity"
          :class="['note-block', { active: activeNotes.has(block.index) }]"
          rx="3"
        />

        <!-- Piano keys (left side) -->
        <rect
          v-for="key in pianoKeys"
          :key="'key' + key.midi"
          x="0"
          :y="key.y"
          :width="PIANO_WIDTH"
          :height="ROW_HEIGHT"
          :class="['piano-key-mini', { black: key.isBlack }]"
        />
        <text
          v-for="key in pianoKeys"
          :key="'keylabel' + key.midi"
          :x="PIANO_WIDTH - 4"
          :y="key.y + ROW_HEIGHT / 2 + 4"
          class="key-label-text"
          text-anchor="end"
        >{{ key.label }}</text>

        <!-- Playhead -->
        <line
          v-if="playing"
          :x1="PIANO_WIDTH + playheadPos * BEAT_WIDTH"
          :y1="0"
          :x2="PIANO_WIDTH + playheadPos * BEAT_WIDTH"
          :y2="svgHeight"
          class="playhead"
        />
        <circle
          v-if="playing"
          :cx="PIANO_WIDTH + playheadPos * BEAT_WIDTH"
          :cy="0"
          r="4"
          class="playhead-dot"
        />
      </svg>
    </div>

    <!-- JSON Event Panel -->
    <div class="json-panel">
      <div class="json-header">事件流 (Event Stream)</div>
      <div class="json-scroll">
        <div
          v-for="(e, i) in song.events"
          :key="i"
          :class="['json-event', {
            active: activeNotes.has(i),
            current: currentEventIndex === i,
          }]"
        >
          <span class="json-brace">{</span>
          <span class="json-key">pitch</span>: <span class="json-str">"{{ e.pitch }}"</span>,
          <span class="json-key">start</span>: <span class="json-num">{{ e.start }}</span>,
          <span class="json-key">duration</span>: <span class="json-num">{{ e.duration }}</span>,
          <span class="json-key">velocity</span>: <span class="json-num">{{ e.velocity }}</span>
          <span class="json-brace">}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.midi-roll-container {
  --roll-white-row: #f8f9fa;
  --roll-black-row: #eef0f2;
  --roll-beat-line: #ddd;
  --roll-measure-line: #bbb;
}

.dark .midi-roll-container {
  --roll-white-row: #1e1e20;
  --roll-black-row: #16161a;
  --roll-beat-line: #333;
  --roll-measure-line: #555;
}

.bpm-display {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}

.roll-viewport {
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 12px 0;
  background: var(--roll-white-row);
  -webkit-overflow-scrolling: touch;
}

.roll-svg {
  display: block;
  min-width: 100%;
}

.note-block {
  fill: var(--vp-c-brand-1);
  transition: fill 0.08s, filter 0.08s;
}

.note-block.active {
  fill: var(--vp-c-brand-3, #7694e8);
  filter: drop-shadow(0 0 6px var(--vp-c-brand-1));
}

.piano-key-mini {
  fill: #f5f5f5;
  stroke: #ddd;
  stroke-width: 0.5;
}

.piano-key-mini.black {
  fill: #333;
  stroke: #222;
}

.dark .piano-key-mini {
  fill: #2a2a2e;
  stroke: #444;
}

.dark .piano-key-mini.black {
  fill: #111;
  stroke: #000;
}

.key-label-text {
  font-size: 9px;
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-base);
}

.beat-label-text {
  font-size: 10px;
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-base);
}

.playhead {
  stroke: #ef4444;
  stroke-width: 2;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
}

.playhead-dot {
  fill: #ef4444;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
}

/* JSON Panel */
.json-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 12px;
}

.json-header {
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.json-scroll {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.78rem;
  line-height: 1.7;
}

.json-event {
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
  white-space: nowrap;
}

.json-event.current {
  background: var(--vp-c-brand-soft);
}

.json-event.active {
  background: var(--vp-c-brand-1);
  color: #fff;
  transform: scale(1.01);
}

.json-event.active .json-key,
.json-event.active .json-str,
.json-event.active .json-num,
.json-event.active .json-brace {
  color: #fff;
}

.json-key {
  color: var(--vp-c-brand-1);
}

.json-str {
  color: #16a34a;
}

.json-num {
  color: #d97706;
}

.json-brace {
  color: var(--vp-c-text-3);
}

.dark .json-str { color: #4ade80; }
.dark .json-num { color: #fbbf24; }
</style>
