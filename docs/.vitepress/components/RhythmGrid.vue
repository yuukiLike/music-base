<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import * as Tone from 'tone'

const STEPS = 8 // 8 eighth-note subdivisions = 2 measures of 4/4 or 4 steps per beat

const grid = reactive<boolean[]>(Array(STEPS).fill(false))
const playing = ref(false)
const currentStep = ref(-1)
const needsActivation = ref(true)
const bpm = ref(100)

const presets: { name: string; pattern: boolean[] }[] = [
  { name: '每拍都响', pattern: [true, false, true, false, true, false, true, false] },
  { name: '第2拍空了', pattern: [true, false, false, false, true, false, true, false] },
  { name: '后半拍', pattern: [false, true, false, true, false, true, false, true] },
  { name: '切分节奏', pattern: [true, false, false, true, false, false, true, false] },
  { name: '清空', pattern: [false, false, false, false, false, false, false, false] },
]

let synth: Tone.Synth | null = null
let loop: Tone.Loop | null = null

function initSynth() {
  if (synth) return
  synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.08 },
    volume: -10,
  }).toDestination()
}

function toggleStep(i: number) {
  grid[i] = !grid[i]
}

function loadPreset(pattern: boolean[]) {
  pattern.forEach((v, i) => { grid[i] = v })
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

  initSynth()
  Tone.getTransport().bpm.value = bpm.value

  let step = 0
  loop = new Tone.Loop((time) => {
    if (grid[step]) {
      synth!.triggerAttackRelease('C5', '16n', time)
    }

    const s = step
    Tone.getDraw().schedule(() => {
      currentStep.value = s
    }, time)

    step = (step + 1) % STEPS
  }, '8n')

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
  currentStep.value = -1
}

onUnmounted(() => {
  stop()
  synth?.dispose()
  synth = null
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
        <input type="range" :min="60" :max="180" v-model.number="bpm" class="bpm-slider" />
        <span class="bpm-val">{{ bpm }}</span>
      </label>
      <button @click="toggle">{{ playing ? '⏹ 停止' : '▶ 播放' }}</button>
    </div>

    <div class="grid-presets">
      <button
        v-for="p in presets"
        :key="p.name"
        @click="loadPreset(p.pattern)"
        class="preset-btn"
      >{{ p.name }}</button>
    </div>

    <div class="rhythm-grid">
      <div class="grid-labels">
        <span v-for="i in STEPS" :key="i" class="grid-label">
          {{ (i - 1) % 2 === 0 ? Math.floor((i - 1) / 2) + 1 : '' }}
        </span>
      </div>
      <div class="grid-row">
        <div
          v-for="(on, i) in grid"
          :key="i"
          class="grid-cell"
          :class="{
            on: on,
            current: currentStep === i,
            downbeat: i % 2 === 0,
          }"
          @click="toggleStep(i)"
        >
          <div class="cell-inner" />
        </div>
      </div>
      <div class="grid-markers">
        <span
          v-for="i in STEPS"
          :key="i"
          class="grid-marker"
          :class="{ beat: (i - 1) % 2 === 0 }"
        >{{ (i - 1) % 2 === 0 ? '|' : '' }}</span>
      </div>
    </div>

    <div class="grid-hint">
      点击格子放置或移除音符 · 深色格子 = 拍头
    </div>
  </div>
</template>

<style scoped>
.bpm-slider {
  width: 100px;
  vertical-align: middle;
  margin: 0 6px;
  accent-color: var(--vp-c-brand-1);
}

.bpm-val {
  display: inline-block;
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.grid-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.preset-btn {
  padding: 4px 10px;
  font-size: 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: all 0.15s;
}

.preset-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.rhythm-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.grid-labels {
  display: flex;
  gap: 4px;
}

.grid-label {
  width: 44px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.grid-row {
  display: flex;
  gap: 4px;
}

.grid-cell {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-divider);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
}

.grid-cell.downbeat {
  border-color: color-mix(in srgb, var(--vp-c-divider) 100%, transparent);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 60%, var(--vp-c-bg));
}

.grid-cell:hover {
  border-color: var(--vp-c-brand-2);
}

.grid-cell.on {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.grid-cell.on .cell-inner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
}

.grid-cell.current {
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
  transform: scale(1.08);
}

.grid-cell.on.current {
  background: var(--vp-c-brand-2);
  box-shadow: 0 0 12px var(--vp-c-brand-1);
}

.grid-markers {
  display: flex;
  gap: 4px;
}

.grid-marker {
  width: 44px;
  text-align: center;
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
}

.grid-hint {
  text-align: center;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-top: 8px;
}

@media (max-width: 640px) {
  .grid-cell {
    width: 36px;
    height: 36px;
  }
  .grid-label, .grid-marker {
    width: 36px;
  }
}
</style>
