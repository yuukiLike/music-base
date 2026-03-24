# MIDI 与结构化表达

这是连接"音乐"和"结构化表达"的桥。

## MIDI 不是音频

MIDI 不是 mp3，也不是已经录好的声音。它更像：**演奏指令**。

```
现在开始发一个音
发 C4
持续 1 拍
力度 90
然后结束
```

MP3 是录好的声波。MIDI 是"怎么弹"的指令表。

## 看到它、听到它

下面是一个**钢琴卷帘**（Piano Roll）— 音乐制作软件中最常见的视图。

- 横轴 = 时间（拍）
- 纵轴 = 音高
- 色块 = 音符事件
- 下方 = 对应的 JSON 事件流

点击播放，看红色播放头扫过时，JSON 和色块如何同步高亮：

<ClientOnly>
  <MidiPianoRoll />
</ClientOnly>

<script setup>
import MidiPianoRoll from '../.vitepress/components/MidiPianoRoll.vue'
</script>

试试切换"小星星"和"和弦进行" — 注意旋律和和弦在钢琴卷帘中的区别：
- **旋律**：色块错开排列（`start` 递增）
- **和弦**：色块垂直对齐（`start` 相同）

## MIDI 里最关键的几个概念

| 概念 | 含义 |
|------|------|
| Note On | 开始发音 |
| Note Off | 结束发音 |
| Velocity | 发音力度（0-127） |
| Tempo | 速度（BPM） |
| Tick / PPQ | 更细粒度的时间单位 |
| Channel | 不同轨道 / 乐器的分路 |

## 用数据结构理解音乐

一个音乐事件可以写成：

```json
{
  "pitch": "C4",
  "start": 0,
  "duration": 1,
  "velocity": 90,
  "instrument": "piano"
}
```

**音乐天然可以被理解为结构化事件流。** 你刚才在钢琴卷帘中看到的，就是这些 JSON 事件的可视化。

## 和弦 vs 旋律：start 字段的秘密

**和弦** = 同一时刻的多个事件（`start` 相同）：

```json
[
  { "pitch": "C4", "start": 0, "duration": 2, "velocity": 80 },
  { "pitch": "E4", "start": 0, "duration": 2, "velocity": 80 },
  { "pitch": "G4", "start": 0, "duration": 2, "velocity": 80 }
]
```

**旋律** = `start` 递增的事件序列：

```json
[
  { "pitch": "C4", "start": 0, "duration": 1 },
  { "pitch": "D4", "start": 1, "duration": 1 },
  { "pitch": "E4", "start": 2, "duration": 1 },
  { "pitch": "G4", "start": 3, "duration": 1 }
]
```

## MIDI Note Number

MIDI 用 0-127 的数字表示音高。中央 C (C4) = 60。

| MIDI 编号 | 音名 | 说明 |
|-----------|------|------|
| 60 | C4 | 中央 C |
| 61 | C#4 | |
| 62 | D4 | |
| 69 | A4 | 标准调音 = 440 Hz |
| 72 | C5 | 高八度 C |

每 +12 = 高一个八度。每 +1 = 高一个半音。

## 回到起点

还记得第一章的公式吗？

> **音乐 = 时间轴上的声音事件集合**

现在你知道了：

- **时间** → beat, tempo, meter, bar, duration
- **声音事件** → pitch, velocity, instrument, articulation
- **横向关系** → melody（序列）
- **纵向关系** → chord（同时），harmony（推进）
- **结构化表达** → MIDI, JSON, 事件流

这就是这份教程的全部骨架。每个概念都可以从这里往深处继续挖。

## 下一步

→ [混淆点速查 + 词汇表](/reference/) — 快速查阅
