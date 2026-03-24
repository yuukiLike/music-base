# 音程 Intervals

**音程**（Interval）是两个音之间的距离。它是乐理中最基础的概念之一 — 旋律是横向的音程序列，和弦是纵向的音程叠加。

## 什么是音程？

当你在钢琴上弹两个不同的音时，它们之间的"距离"就是音程。这个距离用**半音**（semitone）来度量。

- **半音**：钢琴上相邻两个键的距离（包括黑键），例如 C → C# 或 E → F
- **全音**：两个半音的距离，例如 C → D 或 F → G

## 交互式音程演示

选择根音和音程，在钢琴上看到并听到它们：

<ClientOnly>
  <IntervalDemo />
</ClientOnly>

<script setup>
import IntervalDemo from '../.vitepress/components/IntervalDemo.vue'
</script>

## 12 个基本音程

| 半音数 | 音程名称 | 英文名 | 性质 | 示例 (从 C) |
|--------|----------|--------|------|-------------|
| 0 | 纯一度 | Unison | 完全协和 | C → C |
| 1 | 小二度 | Minor 2nd | 不协和 | C → C# |
| 2 | 大二度 | Major 2nd | 不协和 | C → D |
| 3 | 小三度 | Minor 3rd | 不完全协和 | C → D# |
| 4 | 大三度 | Major 3rd | 不完全协和 | C → E |
| 5 | 纯四度 | Perfect 4th | 完全协和 | C → F |
| 6 | 增四度/减五度 | Tritone | 不协和 | C → F# |
| 7 | 纯五度 | Perfect 5th | 完全协和 | C → G |
| 8 | 小六度 | Minor 6th | 不完全协和 | C → G# |
| 9 | 大六度 | Major 6th | 不完全协和 | C → A |
| 10 | 小七度 | Minor 7th | 不协和 | C → A# |
| 11 | 大七度 | Major 7th | 不协和 | C → B |
| 12 | 纯八度 | Octave | 完全协和 | C → C |

## 相关主题

- [和弦](/chords/) — 和弦由多个音程叠加而成
- [音阶](/scales/) — 音阶是按特定音程模式排列的音符序列
