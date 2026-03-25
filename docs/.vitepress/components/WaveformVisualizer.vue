<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as Tone from 'tone'

const needsActivation = ref(true)
const playing = ref(false)
const waveType = ref<OscillatorType>('sine')
const frequency = ref(261.63) // C4

const WAVE_TYPES: { type: OscillatorType; label: string; zh: string }[] = [
  { type: 'sine', label: 'Sine', zh: '正弦波' },
  { type: 'square', label: 'Square', zh: '方波' },
  { type: 'sawtooth', label: 'Sawtooth', zh: '锯齿波' },
  { type: 'triangle', label: 'Triangle', zh: '三角波' },
]

const NOTE_FREQS: { note: string; freq: number }[] = [
  { note: 'C4', freq: 261.63 },
  { note: 'E4', freq: 329.63 },
  { note: 'G4', freq: 392.00 },
  { note: 'C5', freq: 523.25 },
]

let synth: Tone.Oscillator | null = null
let waveAnalyser: Tone.Analyser | null = null
let fftAnalyser: Tone.Analyser | null = null
let gain: Tone.Gain | null = null
let animFrame = 0

const waveCanvas = ref<HTMLCanvasElement | null>(null)
const fftCanvas = ref<HTMLCanvasElement | null>(null)

async function start() {
  if (needsActivation.value) {
    await Tone.start()
    needsActivation.value = false
  }

  stop()

  waveAnalyser = new Tone.Analyser('waveform', 256)
  fftAnalyser = new Tone.Analyser('fft', 256)
  gain = new Tone.Gain(0.25).toDestination()

  synth = new Tone.Oscillator({
    type: waveType.value,
    frequency: frequency.value,
  })

  synth.connect(gain)
  synth.connect(waveAnalyser)
  synth.connect(fftAnalyser)
  synth.start()
  playing.value = true

  draw()

  // Auto stop after 4s
  setTimeout(() => {
    if (playing.value) stop()
  }, 4000)
}

function stop() {
  if (synth) {
    synth.stop()
    synth.dispose()
    synth = null
  }
  if (gain) { gain.dispose(); gain = null }
  playing.value = false
  cancelAnimationFrame(animFrame)
}

function draw() {
  if (!playing.value) return

  // Waveform
  if (waveCanvas.value && waveAnalyser) {
    const canvas = waveCanvas.value
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const data = waveAnalyser.getValue() as Float32Array
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Grid lines
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, h / 2)
      ctx.lineTo(w, h / 2)
      ctx.stroke()

      // Waveform
      ctx.strokeStyle = '#646cff'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < data.length; i++) {
        const x = (i / data.length) * w
        const y = ((1 - data[i]) / 2) * h
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  // FFT
  if (fftCanvas.value && fftAnalyser) {
    const canvas = fftCanvas.value
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const data = fftAnalyser.getValue() as Float32Array
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      const barW = w / data.length * 2.5
      for (let i = 0; i < data.length / 2.5; i++) {
        const val = data[i]
        // dB scale: -100 to 0
        const normalized = Math.max(0, (val + 100) / 100)
        const barH = normalized * h * 0.9

        const hue = 250 + (i / data.length) * 60
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`
        ctx.fillRect(i * barW, h - barH, barW - 1, barH)
      }
    }
  }

  animFrame = requestAnimationFrame(draw)
}

watch(waveType, () => {
  if (synth && playing.value) {
    synth.type = waveType.value
  }
})

watch(frequency, () => {
  if (synth && playing.value) {
    synth.frequency.value = frequency.value
  }
})

onUnmounted(() => {
  stop()
  waveAnalyser?.dispose()
  fftAnalyser?.dispose()
  waveAnalyser = null
  fftAnalyser = null
})
</script>

<template>
  <div class="demo-container wave-viz">
    <div v-if="needsActivation && !playing" class="audio-banner" @click="start">
      点击启用音频
    </div>

    <p class="wave-subtitle">选择波形和频率，观察波形和频谱的变化 — 这就是「音色」的本质。</p>

    <!-- Wave type selector -->
    <div class="wave-controls">
      <div class="wave-types">
        <button
          v-for="w in WAVE_TYPES"
          :key="w.type"
          :class="['wave-btn', { active: waveType === w.type }]"
          @click="waveType = w.type"
        >
          <span class="wave-zh">{{ w.zh }}</span>
          <span class="wave-en">{{ w.label }}</span>
        </button>
      </div>

      <div class="freq-row">
        <span class="freq-label">频率</span>
        <div class="note-btns">
          <button
            v-for="n in NOTE_FREQS"
            :key="n.note"
            :class="['note-btn', { active: Math.abs(frequency - n.freq) < 1 }]"
            @click="frequency = n.freq"
          >{{ n.note }}</button>
        </div>
      </div>
    </div>

    <!-- Canvases -->
    <div class="canvas-row">
      <div class="canvas-box">
        <span class="canvas-label">波形 Waveform</span>
        <canvas ref="waveCanvas" width="400" height="140" class="viz-canvas" />
      </div>
      <div class="canvas-box">
        <span class="canvas-label">频谱 Spectrum</span>
        <canvas ref="fftCanvas" width="400" height="140" class="viz-canvas" />
      </div>
    </div>

    <div class="play-row">
      <button :class="['play-btn', { stop: playing }]" @click="playing ? stop() : start()">
        {{ playing ? '⏹ 停止' : '▶ 播放' }}
      </button>
    </div>

    <div class="wave-explain">
      <p v-if="waveType === 'sine'"><strong>正弦波</strong> — 最纯净的音，只有基频，没有泛音。电子音的基础。</p>
      <p v-else-if="waveType === 'square'"><strong>方波</strong> — 只含奇次泛音（1, 3, 5...），听起来像复古游戏机。</p>
      <p v-else-if="waveType === 'sawtooth'"><strong>锯齿波</strong> — 包含所有泛音，听起来最"亮"，常用于合成器 lead 音色。</p>
      <p v-else-if="waveType === 'triangle'"><strong>三角波</strong> — 类似正弦波但多了少量奇次泛音，更温暖。</p>
    </div>
  </div>
</template>

<style scoped>
.wave-viz {
  padding: 20px;
}

.wave-subtitle {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  margin: 0 0 16px;
}

.wave-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.wave-types {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.wave-btn {
  flex: 1;
  min-width: 80px;
  padding: 10px 8px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.2s;
}

.wave-btn:hover {
  border-color: var(--vp-c-brand-2);
}

.wave-btn.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.wave-zh {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.wave-en {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}

.freq-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.freq-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.note-btns {
  display: flex;
  gap: 6px;
}

.note-btn {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  cursor: pointer;
  font-size: 0.82rem;
  transition: all 0.2s;
}

.note-btn.active {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
}

.canvas-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.canvas-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.canvas-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.viz-canvas {
  width: 100%;
  height: 140px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.play-row {
  text-align: center;
  margin-bottom: 12px;
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

.wave-explain {
  padding: 12px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.wave-explain p {
  margin: 0;
}

@media (max-width: 640px) {
  .canvas-row {
    flex-direction: column;
  }
  .wave-types {
    flex-direction: column;
  }
}
</style>
