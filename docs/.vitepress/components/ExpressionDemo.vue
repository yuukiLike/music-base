<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import * as Tone from 'tone'

const needsActivation = ref(true)
const playing = ref(false)
const velocity = ref(90)
const articulation = ref<'legato' | 'staccato' | 'accent'>('legato')

const MELODY = ['C4', 'D4', 'E4', 'F4', 'E4', 'D4', 'C4']

let synth: Tone.Synth | null = null

function createSynth() {
  synth?.dispose()
  synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: {
      attack: articulation.value === 'staccato' ? 0.005 : 0.02,
      decay: articulation.value === 'staccato' ? 0.05 : 0.15,
      sustain: articulation.value === 'staccato' ? 0 : 0.4,
      release: articulation.value === 'staccato' ? 0.05 : 0.4,
    },
  }).toDestination()
}

async function play() {
  if (playing.value) return

  if (needsActivation.value) {
    await Tone.start()
    needsActivation.value = false
  }

  createSynth()
  if (!synth) return

  playing.value = true
  const bpm = 120
  const beatSec = 60 / bpm

  // Duration per note depends on articulation
  const noteDur = articulation.value === 'staccato'
    ? beatSec * 0.3
    : articulation.value === 'accent'
      ? beatSec * 0.7
      : beatSec * 0.9

  const vol = -30 + (velocity.value / 127) * 30
  synth.volume.value = vol

  const now = Tone.now() + 0.05
  for (let i = 0; i < MELODY.length; i++) {
    const time = now + i * beatSec
    const v = articulation.value === 'accent' && i % 2 === 0
      ? Math.min(velocity.value + 20, 127)
      : velocity.value

    const noteVol = -30 + (v / 127) * 30
    synth.volume.setValueAtTime(noteVol, time)
    synth.triggerAttackRelease(MELODY[i], noteDur, time)
  }

  const totalMs = MELODY.length * beatSec * 1000
  setTimeout(() => {
    playing.value = false
  }, totalMs + 200)
}

onUnmounted(() => {
  synth?.dispose()
  synth = null
})

const velocityLabel = (v: number) => {
  if (v < 30) return 'pp（很弱）'
  if (v < 50) return 'p（弱）'
  if (v < 70) return 'mp（中弱）'
  if (v < 90) return 'mf（中强）'
  if (v < 110) return 'f（强）'
  return 'ff（很强）'
}
</script>

<template>
  <div class="demo-container">
    <div v-if="needsActivation && !playing" class="audio-banner" @click="play">
      点击启用音频 🔊
    </div>

    <p class="expr-subtitle">同一段旋律 (C D E F E D C)，调整力度和演奏法，听听区别：</p>

    <div class="expr-controls">
      <div class="control-group">
        <label class="control-label">力度 (Velocity)</label>
        <div class="slider-row">
          <input
            type="range"
            min="10"
            max="127"
            v-model.number="velocity"
            class="expr-slider"
          />
          <span class="slider-val">{{ velocity }}</span>
        </div>
        <span class="slider-hint">{{ velocityLabel(velocity) }}</span>
      </div>

      <div class="control-group">
        <label class="control-label">演奏法 (Articulation)</label>
        <div class="art-buttons">
          <button
            :class="['art-btn', { active: articulation === 'legato' }]"
            @click="articulation = 'legato'"
          >
            <span class="art-icon">〰</span>
            <span>连奏 Legato</span>
          </button>
          <button
            :class="['art-btn', { active: articulation === 'staccato' }]"
            @click="articulation = 'staccato'"
          >
            <span class="art-icon">· · ·</span>
            <span>断奏 Staccato</span>
          </button>
          <button
            :class="['art-btn', { active: articulation === 'accent' }]"
            @click="articulation = 'accent'"
          >
            <span class="art-icon">></span>
            <span>重音 Accent</span>
          </button>
        </div>
      </div>
    </div>

    <div class="play-row">
      <button @click="play" :disabled="playing" class="play-main">
        {{ playing ? '正在播放...' : '▶ 播放' }}
      </button>
    </div>

    <!-- Visual velocity meter -->
    <div class="vel-meter">
      <div class="vel-bar" :style="{ width: (velocity / 127 * 100) + '%' }" />
      <div class="vel-dots">
        <span v-for="i in 7" :key="i" class="vel-dot" :class="{ lit: velocity >= i * 18 }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.expr-subtitle {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0 0 16px;
}

.expr-controls {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expr-slider {
  flex: 1;
  accent-color: var(--vp-c-brand-1);
  height: 6px;
}

.slider-val {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-brand-1);
}

.slider-hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.art-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.art-btn {
  flex: 1;
  min-width: 100px;
  padding: 10px 12px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  color: var(--vp-c-text-2);
}

.art-btn:hover {
  border-color: var(--vp-c-brand-2);
}

.art-btn.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.art-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.art-btn span:last-child {
  font-size: 0.78rem;
}

.play-row {
  margin-bottom: 12px;
}

.play-main {
  padding: 8px 24px;
  font-size: 0.95rem;
}

.play-main:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Velocity meter */
.vel-meter {
  position: relative;
  height: 28px;
  background: var(--vp-c-bg);
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.vel-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand-soft), var(--vp-c-brand-1));
  border-radius: 14px;
  transition: width 0.2s ease;
}

.vel-dots {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 0 12px;
}

.vel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  transition: all 0.2s;
  z-index: 1;
}

.vel-dot.lit {
  background: #fff;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
}

@media (max-width: 640px) {
  .art-buttons {
    flex-direction: column;
  }
}
</style>
