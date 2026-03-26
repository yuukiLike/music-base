# MidiPianoRoll：事件流与播放同步的实现

这篇文档拆解 `MidiPianoRoll.vue` 组件的核心设计 — 如何把一组静态的 JSON 事件，变成"播放时同步高亮"的视听体验。

## 整体架构

三个独立的时间轴，由同一份事件数据驱动：

```
MidiEvent[]
  │
  ├─→ SVG 渲染层   noteBlocks (computed)  → 静态色块
  ├─→ 音频调度层   Tone.js schedule       → 精确发音
  └─→ 视觉同步层   setTimeout + rAF       → 高亮 + 播放头
```

关键洞察：**音频和视觉用不同的时钟**。音频需要精确（Tone.js 的 AudioContext 时钟），视觉只需要"看起来对"（浏览器的 setTimeout + requestAnimationFrame）。

## 数据模型

一个音符事件只有 4 个字段：

```ts
interface MidiEvent {
  pitch: string    // "C4" — 音名+八度
  start: number    // 0 — 起始拍（beat）
  duration: number // 1 — 持续拍数
  velocity: number // 90 — 力度（0-127）
}
```

一首曲子 = 事件数组 + BPM：

```ts
{ name: '小星星', bpm: 110, events: MidiEvent[] }
```

所有后续计算都从这个结构派生。没有额外状态。

## 第一层：SVG 静态渲染

### 坐标系映射

事件的 `start` 和 `duration` 是以"拍"为单位的抽象时间。渲染时需要映射到像素：

```ts
const BEAT_WIDTH = 60   // 每拍 60px
const ROW_HEIGHT = 20   // 每个音高 20px
const PIANO_WIDTH = 48  // 左侧琴键区宽度
```

一个事件变成一个色块：

```ts
const noteBlocks = computed(() => {
  return song.value.events.map((e, i) => {
    const midi = pitchToMidi(e.pitch)
    return {
      x: PIANO_WIDTH + e.start * BEAT_WIDTH,      // 水平位置 = 起始拍 × 拍宽
      y: midiToRow(midi) * ROW_HEIGHT,             // 垂直位置 = 音高行号 × 行高
      width: e.duration * BEAT_WIDTH - 2,          // 宽度 = 持续拍数 × 拍宽
      height: ROW_HEIGHT - 2,                      // 高度 = 行高（留 2px 间距）
      opacity: 0.5 + (e.velocity / 127) * 0.5,    // 透明度编码力度
    }
  })
})
```

### 音高到行号

音高用 MIDI 编号（0-127），高音在上，所以行号是反转的：

```ts
function pitchToMidi(pitch: string): number {
  // "C4" → 60, "A4" → 69
  const note = NOTE_NAMES.indexOf(match[1])
  const octave = parseInt(match[2], 10)
  return (octave + 1) * 12 + note
}

function midiToRow(midi: number): number {
  return pitchRange.value.max - midi  // 高音 = 小行号 = 在上方
}
```

### 自适应音域

不是固定显示 128 行，而是根据实际事件计算范围，上下各留 1 个音的余量：

```ts
const pitchRange = computed(() => {
  let min = 127, max = 0
  for (const e of song.value.events) {
    const midi = pitchToMidi(e.pitch)
    min = Math.min(min, midi)
    max = Math.max(max, midi)
  }
  return { min: min - 1, max: max + 1 }
})
```

小星星只用 C4-A4，所以只渲染 ~8 行，而不是 128 行。

## 第二层：音频调度

### 双层音频策略（useAudio.ts）

```
用户点击播放
  │
  ├─ Sampler 已加载？ → Tone.Sampler.triggerAttackRelease()  // 真实钢琴采样
  └─ 未加载？         → OscillatorNode fallback              // 正弦波，即时可用
```

Sampler 从 tonejs.github.io 加载 Salamander 钢琴采样（按需加载，覆盖 A0-C8）。首次播放时可能还没加载完，所以用 OscillatorNode 做即时回退：

```ts
function playWithOscillator(noteStr: string): void {
  const frequency = 440 * Math.pow(2, (midi - 69) / 12)  // A4=440Hz 为基准
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = frequency
  // 0.8 秒内指数衰减到静音
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
}
```

### 精确时间调度

关键：**不是每到一个音就调用 playNote，而是在播放开始时一次性调度所有音符**。

```ts
song.value.events.forEach((e, i) => {
  // 用 Tone.js 的 AudioContext 时钟调度，精度 ~1ms
  const noteStartSec = Tone.now() + 0.05 + e.start * beatDuration
  const noteDurSec = e.duration * beatDuration
  playNote(e.pitch, noteStartSec, noteDurSec)
})
```

`Tone.now() + 0.05` — 加 50ms 的 look-ahead，给 AudioContext 缓冲时间。这是 Web Audio 的标准做法：提前把事件塞进调度队列，而不是实时触发。

## 第三层：视觉同步

视觉同步有两个独立机制：

### 1. 音符高亮（setTimeout）

```ts
song.value.events.forEach((e, i) => {
  const startMs = e.start * beatDuration * 1000
  const durMs = e.duration * beatDuration * 1000

  // 高亮开
  window.setTimeout(() => {
    activeNotes.value.add(i)
  }, startMs)

  // 高亮关
  window.setTimeout(() => {
    activeNotes.value.delete(i)
  }, startMs + durMs)
})
```

`activeNotes` 是一个 `Set<number>`，存当前高亮的事件索引。Vue 的响应式系统自动更新 SVG 中的 CSS class：

```html
<rect :class="['note-block', { active: activeNotes.has(block.index) }]" />
```

高亮时的视觉效果：

```css
.note-block.active {
  fill: var(--vp-c-brand-3);
  filter: drop-shadow(0 0 6px var(--vp-c-brand-1));  /* 发光 */
}
```

### 2. 播放头动画（requestAnimationFrame）

播放头不是跳跃的，是连续移动的。用 rAF 实现平滑动画：

```ts
startTime = performance.now()
const totalMs = totalDuration * 1000

function animate(timestamp: number) {
  const elapsed = timestamp - startTime
  const progress = Math.min(elapsed / totalMs, 1)
  playheadPos.value = progress * totalBeats  // 0 → totalBeats 线性插值

  if (progress < 1 && playing.value) {
    animFrame = requestAnimationFrame(animate)
  } else if (playing.value) {
    stopPlay()
  }
}
```

播放头位置直接映射到 SVG x 坐标：

```html
<line
  :x1="PIANO_WIDTH + playheadPos * BEAT_WIDTH"
  :y1="0"
  :x2="PIANO_WIDTH + playheadPos * BEAT_WIDTH"
  :y2="svgHeight"
  class="playhead"
/>
```

### 3. JSON 面板同步

`currentEventIndex` 根据播放头位置实时计算当前事件：

```ts
const currentEventIndex = computed(() => {
  const pos = playheadPos.value
  for (let i = song.value.events.length - 1; i >= 0; i--) {
    const e = song.value.events[i]
    if (pos >= e.start && pos < e.start + e.duration) return i
  }
  return -1
})
```

JSON 面板中，`active` 和 `current` 是两个独立状态：
- `active` = 正在发音（由 setTimeout 驱动的 activeNotes）
- `current` = 播放头正在经过（由 rAF 驱动的 currentEventIndex）

```html
<div :class="['json-event', {
  active: activeNotes.has(i),      // 正在发音 → 全色高亮
  current: currentEventIndex === i, // 播放头经过 → 柔和背景
}]">
```

## 为什么用三套时钟

| 层 | 时钟 | 原因 |
|---|---|---|
| 音频 | `Tone.now()` (AudioContext) | 精度要求高，~1ms 级别，setTimeout 会飘 |
| 高亮 | `setTimeout` | 精度要求低（人眼分辨 ~16ms），且需要触发 Vue 响应式 |
| 播放头 | `requestAnimationFrame` | 需要逐帧平滑移动，和屏幕刷新率同步 |

如果全用 setTimeout：播放头会卡顿。如果全用 rAF：音频会不准。如果全用 AudioContext：无法直接触发 DOM 更新。

三套时钟各司其职，由同一份 `MidiEvent[]` 数据驱动，天然保持同步。

## 停止与清理

```ts
function stopPlay() {
  playing.value = false
  cancelAnimationFrame(animFrame)       // 停止播放头
  activeNotes.value = new Set()          // 清除所有高亮
  visualTimers.forEach(t => clearTimeout(t))  // 取消所有待触发的高亮
  visualTimers = []
}
```

`onUnmounted` 时也调用 `stopPlay()`，防止组件卸载后仍有 setTimeout 回调。

## 整体数据流

```
MidiEvent[] ─────────────────────────────────────────────────
  │                                                          │
  │  播放时一次性调度                                           │  computed 实时派生
  │                                                          │
  ├── Tone.js schedule ──→ AudioContext Queue ──→ 扬声器       │
  │     (精确音频时钟)                                         │
  │                                                          │
  ├── setTimeout ──→ activeNotes (Set) ──→ SVG class 切换     ├── noteBlocks ──→ SVG rect
  │     (高亮开/关)        (Vue reactive)    (CSS 动画)        │    (静态色块位置)
  │                                                          │
  └── rAF loop ──→ playheadPos (ref) ──→ SVG line x 坐标     ├── pianoKeys ──→ SVG 左侧琴键
        (逐帧更新)    (Vue reactive)     (平滑移动)             │
                         │                                    └── beatLines ──→ SVG 网格线
                         └──→ currentEventIndex (computed)
                                    │
                                    └──→ JSON 面板 "current" 高亮
```

## 设计决策总结

1. **声明式数据，命令式播放** — 事件数组是纯数据（声明式），播放逻辑是 side effect（命令式），两者通过 `togglePlay()` 连接
2. **渲染和播放解耦** — SVG 色块通过 `computed` 从数据派生，不依赖播放状态；播放只叠加高亮
3. **优雅降级** — Sampler 未加载时用 OscillatorNode 回退，不阻塞用户交互
4. **最小状态** — 只有 3 个响应式状态参与播放：`playing`、`playheadPos`、`activeNotes`
