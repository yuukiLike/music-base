<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio'
import { midiToNote, noteToMidi } from '../utils/music'

const { needsActivation, activate, playChord } = useAudio()

const ROOT_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Scale degrees in major: semitones from root + chord quality
const DEGREES: Record<string, { offset: number; type: 'major' | 'minor' | 'dim' }> = {
  'I':    { offset: 0,  type: 'major' },
  'ii':   { offset: 2,  type: 'minor' },
  'iii':  { offset: 4,  type: 'minor' },
  'IV':   { offset: 5,  type: 'major' },
  'V':    { offset: 7,  type: 'major' },
  'vi':   { offset: 9,  type: 'minor' },
  'vii°': { offset: 11, type: 'dim' },
}

const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim:   [0, 3, 6],
}

const PROGRESSIONS = [
  { name: 'I - IV - V - I', label: '经典终止', degrees: ['I', 'IV', 'V', 'I'] },
  { name: 'I - V - vi - IV', label: '流行万能', degrees: ['I', 'V', 'vi', 'IV'] },
  { name: 'I - vi - IV - V', label: '50年代', degrees: ['I', 'vi', 'IV', 'V'] },
  { name: 'ii - V - I', label: '爵士经典', degrees: ['ii', 'V', 'I'] },
  { name: 'vi - IV - I - V', label: '小调流行', degrees: ['vi', 'IV', 'I', 'V'] },
  { name: 'I - IV - vi - V', label: '抒情', degrees: ['I', 'IV', 'vi', 'V'] },
]

const rootKey = ref('C')
const selectedProg = ref(0)
const playing = ref(false)
const activeChordIdx = ref(-1)

let playTimeout: ReturnType<typeof setTimeout>[] = []

const progression = computed(() => PROGRESSIONS[selectedProg.value])

const chordDetails = computed(() => {
  const rootMidi = noteToMidi(rootKey.value + '3')
  return progression.value.degrees.map(deg => {
    const info = DEGREES[deg]
    const chordRoot = rootMidi + info.offset
    const intervals = CHORD_INTERVALS[info.type]
    const notes = intervals.map(i => midiToNote(chordRoot + i))
    const rootName = midiToNote(chordRoot).replace(/\d+/, '')
    const suffix = info.type === 'minor' ? 'm' : info.type === 'dim' ? 'dim' : ''
    return {
      degree: deg,
      name: rootName + suffix,
      notes,
    }
  })
})

async function play() {
  if (playing.value) {
    stop()
    return
  }

  if (needsActivation.value) {
    await activate()
  }

  playing.value = true
  activeChordIdx.value = -1
  const bpm = 100
  const beatSec = (60 / bpm) * 2 // half notes

  chordDetails.value.forEach((chord, i) => {
    const t = setTimeout(() => {
      activeChordIdx.value = i
      playChord(chord.notes, '2n')
    }, i * beatSec * 1000)
    playTimeout.push(t)
  })

  const endT = setTimeout(() => {
    playing.value = false
    activeChordIdx.value = -1
  }, chordDetails.value.length * beatSec * 1000 + 400)
  playTimeout.push(endT)
}

function stop() {
  playTimeout.forEach(clearTimeout)
  playTimeout = []
  playing.value = false
  activeChordIdx.value = -1
}

function tapChord(idx: number) {
  if (needsActivation.value) {
    activate().then(() => playChord(chordDetails.value[idx].notes, '2n'))
  } else {
    playChord(chordDetails.value[idx].notes, '2n')
  }
}

onUnmounted(stop)
</script>

<template>
  <div class="demo-container prog-player">
    <div v-if="needsActivation" class="audio-banner" @click="activate">
      点击启用音频
    </div>

    <!-- Key selector -->
    <div class="prog-controls">
      <label class="control-label">
        调性
        <select v-model="rootKey" class="key-select">
          <option v-for="r in ROOT_OPTIONS" :key="r" :value="r">{{ r }} 大调</option>
        </select>
      </label>
    </div>

    <!-- Progression selector -->
    <div class="prog-list">
      <button
        v-for="(p, i) in PROGRESSIONS"
        :key="i"
        :class="['prog-btn', { active: selectedProg === i }]"
        @click="selectedProg = i; stop()"
      >
        <span class="prog-label">{{ p.label }}</span>
        <span class="prog-degrees">{{ p.name }}</span>
      </button>
    </div>

    <!-- Chord cards -->
    <div class="chord-cards">
      <div
        v-for="(chord, i) in chordDetails"
        :key="i"
        :class="['chord-card', { active: activeChordIdx === i }]"
        @click="tapChord(i)"
      >
        <span class="chord-degree">{{ chord.degree }}</span>
        <span class="chord-name">{{ chord.name }}</span>
        <span class="chord-notes">{{ chord.notes.join(' ') }}</span>
      </div>
    </div>

    <!-- Play button -->
    <div class="play-row">
      <button :class="['play-btn', { stop: playing }]" @click="play">
        {{ playing ? '⏹ 停止' : '▶ 播放进行' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.prog-player {
  padding: 20px;
}

.prog-controls {
  margin-bottom: 16px;
}

.control-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-select {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  font-size: 0.88rem;
}

.prog-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}

.prog-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.prog-btn:hover {
  border-color: var(--vp-c-brand-2);
}

.prog-btn.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.prog-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.prog-degrees {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  font-family: monospace;
}

.chord-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.chord-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 20px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.25s;
  min-width: 80px;
}

.chord-card:hover {
  border-color: var(--vp-c-brand-2);
  transform: translateY(-2px);
}

.chord-card.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.chord-degree {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  font-family: serif;
}

.chord-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.chord-notes {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  font-family: monospace;
}

.play-row {
  text-align: center;
}

.play-btn {
  padding: 10px 32px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.play-btn.stop {
  background: #ef4444;
}

@media (max-width: 640px) {
  .prog-list {
    grid-template-columns: repeat(2, 1fr);
  }
  .chord-card {
    padding: 12px 14px;
    min-width: 64px;
  }
}
</style>
