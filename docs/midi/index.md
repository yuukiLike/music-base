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

多个事件可以写成：

```json
[
  { "pitch": "C4", "start": 0, "duration": 1, "velocity": 90 },
  { "pitch": "E4", "start": 1, "duration": 1, "velocity": 85 },
  { "pitch": "G4", "start": 2, "duration": 2, "velocity": 95 }
]
```

**音乐天然可以被理解为结构化事件流。**

## 和弦用数据结构表达

和弦 = 同一时刻的多个事件：

```json
[
  { "pitch": "C4", "start": 0, "duration": 2, "velocity": 80 },
  { "pitch": "E4", "start": 0, "duration": 2, "velocity": 80 },
  { "pitch": "G4", "start": 0, "duration": 2, "velocity": 80 }
]
```

三个事件的 `start` 相同 → 同时发声 → 这就是一个 C 大三和弦。

## 旋律用数据结构表达

旋律 = `start` 递增的事件序列：

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

## 进一步探索

这也是为什么音乐很适合进一步讨论：

- MIDI 编程
- 乐谱抽象
- 音乐 AST
- Markdown 风格音乐描述语言

## 下一步

→ [混淆点速查 + 词汇表](/reference/) — 快速查阅
