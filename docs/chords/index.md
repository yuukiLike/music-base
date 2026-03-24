# 和弦 Chords

**和弦**（Chord）是三个或更多音同时发声。和弦是音乐中的"和声骨架" — 旋律在和弦上方流动，节奏推动和弦前进。

## 什么是和弦？

和弦的本质是**音程的叠加**。最基本的和弦由三个音组成（三和弦），通过叠加三度音程构建。

## 交互式和弦构建器

选择根音和和弦类型，在钢琴上看到并听到：

<ClientOnly>
  <ChordBuilder />
</ClientOnly>

<script setup>
import ChordBuilder from '../.vitepress/components/ChordBuilder.vue'
</script>

## 和弦分类速查

### 三和弦（3 个音）
| 和弦类型 | 音程结构 | 听感 | 示例 (C) |
|----------|----------|------|----------|
| [大三和弦](/chords/major) | 大三度 + 小三度 | 明亮、快乐 | C-E-G |
| [小三和弦](/chords/minor) | 小三度 + 大三度 | 忧郁、柔和 | C-Eb-G |
| [减三和弦](/chords/dim-aug) | 小三度 + 小三度 | 紧张、不稳定 | C-Eb-Gb |
| [增三和弦](/chords/dim-aug) | 大三度 + 大三度 | 梦幻、悬浮 | C-E-G# |

### 七和弦（4 个音）
| 和弦类型 | 音程结构 | 常见用途 |
|----------|----------|----------|
| [大七和弦](/chords/seventh) | 大三 + 纯五 + 大七 | 流行、爵士 |
| [小七和弦](/chords/seventh) | 小三 + 纯五 + 小七 | 爵士、R&B |
| [属七和弦](/chords/seventh) | 大三 + 纯五 + 小七 | 布鲁斯、解决到主和弦 |

## 相关主题

- [音程](/intervals/) — 和弦的构建基础
- [音阶](/scales/) — 和弦与音阶的关系
- [和声进行](/progressions/) — 和弦如何连接（即将推出）
