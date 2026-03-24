<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import * as Tone from 'tone'

const bpm = ref(90)
const meter = ref(4) // beats per measure
const playing = ref(false)
const currentBeat = ref(-1)
const needsActivation = ref(true)

let clickHigh: Tone.Synth | null = null
let clickLow: Tone.Synth | null = null
let loop: Tone.Loop | null = null

const beats = computed(() => {
  return Array.from({ length: meter.value }, (_, i) => i)
})

const beatSize = computed(() => {
  if (meter.value === 4) return [1, 0.5, 0.75, 0.5]
  if (meter.value === 3) return [1, 0.5, 0.5]
  return Array(meter.value).fill(0.6)
})

function initSynths() {
  if (clickHigh) return
  clickHigh = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
    volume: -6,
  }).toDestination()
  clickLow = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
    volume: -12,
  }).toDestination()
}

async function toggle() {
  if (playing.value) {
    stop()
    return
  }

  if (needsActivation.value) {
    await Tone.start()
    needsActivation.value = false
  }

  initSynths()
  Tone.getTransport().bpm.value = bpm.value

  let beatIndex = 0
  loop = new Tone.Loop((time) => {
    const isStrong = beatIndex === 0
    if (isStrong) {
      clickHigh?.triggerAttackRelease('C6', '32n', time)
    } else {
      clickLow?.triggerAttackRelease('C5', '32n', time)
    }

    const b = beatIndex
    Tone.getDraw().schedule(() => {
      currentBeat.value = b
    }, time)

    beatIndex = (beatIndex + 1) % meter.value
  }, '4n')

  loop.start(0)
  Tone.getTransport().start()
  playing.value = true
}

function stop() {
  loop?.stop()
  loop?.dispose()
  loop = null
  Tone.getTransport().stop()
  Tone.getTransport().position = 0
  playing.value = false
  currentBeat.value = -1
}

watch(bpm, (val) => {
  Tone.getTransport().bpm.value = val
})

watch(meter, () => {
  if (playing.value) {
    stop()
  }
})

onUnmounted(() => {
  stop()
  clickHigh?.dispose()
  clickLow?.dispose()
  clickHigh = null
  clickLow = null
})
</script>

<template>
  <div class="demo-container">
    <div v-if="needsActivation && !playing" class="audio-banner" @click="toggle">
      点击启用音频 🔊
    </div>

    <div class="demo-controls">
      <label>
        BPM：
        <input type="range" :min="40" :max="200" v-model.number="bpm" class="bpm-slider" />
        <span class="bpm-value">{{ bpm }}</span>
      </label>

      <label>
        拍号：
        <select v-model.number="meter">
          <option :value="4">4/4</option>
          <option :value="3">3/4</option>
        </select>
      </label>

      <button @click="toggle">{{ playing ? '⏹ 停止' : '▶ 播放' }}</button>
    </div>

    <div class="beat-row">
      <div
        v-for="i in beats"
        :key="i"
        class="beat-cell"
      >
        <div
          class="beat-circle"
          :class="{ active: currentBeat === i, strong: i === 0 }"
          :style="{
            width: (40 + beatSize[i] * 30) + 'px',
            height: (40 + beatSize[i] * 30) + 'px',
          }"
        />
        <div class="beat-label">{{ i + 1 }}</div>
      </div>
    </div>

    <div class="beat-info">
      <span>每拍 {{ (60 / bpm).toFixed(2) }} 秒</span>
      <span>·</span>
      <span>每小节 {{ meter }} 拍</span>
      <span>·</span>
      <span>1 分钟 = {{ Math.floor(bpm / meter) }} 小节</span>
    </div>
  </div>
</template>

<style scoped>
.bpm-slider {
  width: 120px;
  vertical-align: middle;
  margin: 0 6px;
  accent-color: var(--vp-c-brand-1);
}

.bpm-value {
  display: inline-block;
  min-width: 36px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.beat-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 0;
}

.beat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.beat-circle {
  border-radius: 50%;
  background: var(--vp-c-divider);
  transition: all 0.08s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.beat-circle.active {
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 20px var(--vp-c-brand-soft);
  transform: scale(1.15);
}

.beat-circle.strong {
  border: 2px solid var(--vp-c-brand-2);
}

.beat-circle.active.strong {
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 28px var(--vp-c-brand-1);
  transform: scale(1.25);
}

.beat-label {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

.beat-info {
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
