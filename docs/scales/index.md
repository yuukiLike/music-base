# 音阶与调式 Scales & Modes

**音阶**（Scale）是按特定音程模式排列的一组音符。音阶是旋律和和声的"调色板" — 它决定了一首曲子有哪些音可用。

## 什么是音阶？

音阶就是从一个音（根音）出发，按照特定的"半音-全音"排列规则，走到高八度的同名音。

## 交互式音阶展示

选择根音和音阶类型，在钢琴上看到并听到：

<ClientOnly>
  <ScaleDisplay />
</ClientOnly>

<script setup>
import ScaleDisplay from '../.vitepress/components/ScaleDisplay.vue'
</script>

## 常见音阶类型

### 七声音阶（7 个音）
| 类型 | 音程模式 | 特点 |
|------|----------|------|
| [大调](/scales/major) | W-W-H-W-W-W-H | 最基础，明亮积极 |
| [自然小调](/scales/natural-minor) | W-H-W-W-H-W-W | 大调的"忧郁版" |
| [和声小调](/scales/harmonic-melodic) | W-H-W-W-H-W½-H | 异域风情 |
| [旋律小调](/scales/harmonic-melodic) | W-H-W-W-W-W-H | 爵士常用 |

### 教会调式（7 个音）
| 类型 | 基于大调 | 特点 |
|------|----------|------|
| [多利亚](/scales/modes) | 第 2 音开始 | 小调但更明亮 |
| [弗里几亚](/scales/modes) | 第 3 音开始 | 异域、西班牙风 |
| [利底亚](/scales/modes) | 第 4 音开始 | 梦幻、飘浮 |
| [混合利底亚](/scales/modes) | 第 5 音开始 | 摇滚、布鲁斯 |

### 五声与特殊音阶
| 类型 | 音数 | 特点 |
|------|------|------|
| [大调五声](/scales/pentatonic) | 5 | 民歌、即兴万能 |
| [小调五声](/scales/pentatonic) | 5 | 摇滚、布鲁斯即兴 |
| [布鲁斯](/scales/blues) | 6 | 蓝调特有的色彩 |
| [半音阶](/scales/chromatic) | 12 | 所有 12 个半音 |

## 相关主题

- [音程](/intervals/) — 音阶由音程模式构成
- [和弦](/chords/) — 音阶内的和弦（顺阶和弦）
- [调性与五度圈](/keys/) — 调性系统（即将推出）
