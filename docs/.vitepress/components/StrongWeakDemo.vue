<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import * as Tone from 'tone'

type Pattern = { beats: number; strengths: number[]; labels: string[]; name: string }

const patterns: Pattern[] = [
  {
    beats: 4, name: '4/4',
    strengths: [1, 0.3, 0.65, 0.3],
    labels: ['强', '弱', '次强', '弱'],
  },
  {
    beats: 3, name: '3/4',
    strengths: [1, 0.3, 0.3],
    labels: ['强', '弱', '弱'],
  },
]

const playing = ref(-1)
const currentBeat = ref(-1)
const needsActivation = ref(true)

let synthHi: Tone.Synth | null = null
let synthLo: Tone.Synth | null = null
let loop: Tone.Loop | null = null

function initSynths() {
  if (synthHi) return
  synthHi = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
  }).toDestination()
  synthLo = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
  }).toDestination()
}

async function play(idx: number) {
  stop()

  if (needsActivation.value) {
    await Tone.start()
    needsActivation.value = false
  }

  initSynths()
  const pattern = patterns[idx]
  playing.value = idx
  Tone.getTransport().bpm.value = 100

  let beatIndex = 0
  loop = new Tone.Loop((time) => {
    const strength = pattern.strengths[beatIndex]
    const vol = -20 + strength * 20
    if (strength > 0.6) {
      synthHi!.volume.value = vol
      synthHi!.triggerAttackRelease('G5', '32n', time)
    } else {
      synthLo!.volume.value = vol
      synthLo!.triggerAttackRelease('E5', '32n', time)
    }

    const b = beatIndex
    Tone.getDraw().schedule(() => {
      currentBeat.value = b
    }, time)

    beatIndex = (beatIndex + 1) % pattern.beats
  }, '4n')

  loop.start(0)
  Tone.getTransport().start()

  // Play 4 measures then stop
  const totalBeats = pattern.beats * 4
  const durationSec = (60 / 100) * totalBeats
  setTimeout(() => {
    if (playing.value === idx) stop()
  }, durationSec * 1000 + 200)
}

function stop() {
  loop?.stop()
  loop?.dispose()
  loop = null
  Tone.getTransport().stop()
  Tone.getTransport().position = 0
  playing.value = -1
  currentBeat.value = -1
}

onUnmounted(() => {
  stop()
  synthHi?.dispose()
  synthLo?.dispose()
  synthHi = null
  synthLo = null
})
</script>

<template>
  <div class="demo-container">
    <div v-if="needsActivation" class="audio-banner" @click="play(0)">
      点击启用音频 🔊
    </div>

    <div v-for="(pattern, idx) in patterns" :key="idx" class="pattern-row">
      <div class="pattern-header">
        <strong>{{ pattern.name }}</strong>
        <button @click="play(idx)" class="play-btn-small">
          {{ playing === idx ? '⏹' : '▶' }}
        </button>
      </div>
      <div class="beat-row">
        <div v-for="(s, i) in pattern.strengths" :key="i" class="beat-cell">
          <div
            class="beat-circle-sw"
            :class="{ active: playing === idx && currentBeat === i }"
            :style="{
              width: (24 + s * 40) + 'px',
              height: (24 + s * 40) + 'px',
              opacity: 0.35 + s * 0.65,
            }"
          />
          <div class="beat-num">{{ i + 1 }}</div>
          <div class="beat-strength" :class="{ strong: s > 0.6 }">{{ pattern.labels[i] }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pattern-row {
  margin-bottom: 20px;
}

.pattern-row:last-child {
  margin-bottom: 0;
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.play-btn-small {
  padding: 2px 10px;
  font-size: 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.play-btn-small:hover {
  background: var(--vp-c-brand-soft);
}

.beat-row {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 8px 0;
}

.beat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
}

.beat-circle-sw {
  border-radius: 50%;
  background: var(--vp-c-brand-2);
  transition: all 0.08s ease;
}

.beat-circle-sw.active {
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 20px var(--vp-c-brand-soft);
  transform: scale(1.2);
}

.beat-num {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}

.beat-strength {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.beat-strength.strong {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
</style>
