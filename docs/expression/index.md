# 表达层

即使时间和音高都一样，听感还是会因为表达层而不同。

## 亲手感受

调整力度滑块和演奏法按钮，听同一段旋律的变化：

<ClientOnly>
  <ExpressionDemo />
</ClientOnly>

<script setup>
import ExpressionDemo from '../.vitepress/components/ExpressionDemo.vue'
import WaveformVisualizer from '../.vitepress/components/WaveformVisualizer.vue'
</script>

## Dynamics / 力度

力度表示：**声音的强弱**。

| 记号 | 意大利语 | 含义 | Velocity 范围 |
|------|----------|------|--------------|
| pp | pianissimo | 很弱 | ~20-30 |
| p | piano | 弱 | ~30-50 |
| mp | mezzo-piano | 中弱 | ~50-70 |
| mf | mezzo-forte | 中强 | ~70-90 |
| f | forte | 强 | ~90-110 |
| ff | fortissimo | 很强 | ~110-127 |

在 MIDI 语境下，力度和 `velocity`（速度值 0-127）很接近。velocity 越高，弹得越重。

刚才你拖动滑块时，就是在改变 velocity 值。

## Timbre / 音色

音色表示：**为什么同一个音高，不同乐器听起来不一样**。

- 钢琴的 C4
- 小提琴的 C4
- 人声的 C4

音高一样，但质感不同。

所以：

- **pitch** = 高低
- **timbre** = 质感

音色由**泛音结构**决定 — 同一个基础频率上叠加了不同的泛音比例，就形成了不同的"声音指纹"。

### 亲眼看到音色

不同波形 = 不同泛音结构 = 不同音色。播放下面的四种波形，观察波形和频谱的区别：

<ClientOnly>
  <WaveformVisualizer />
</ClientOnly>

## Articulation / 演奏法

演奏法表示：**这个音是怎么被发出来的**。

| 演奏法 | 英文 | 效果 | 你刚才听到的 |
|--------|------|------|-------------|
| 连奏 | Legato | 音与音之间无缝连接 | 平滑流动 |
| 断奏 | Staccato | 短促、跳跃 | 清脆跳动 |
| 重音 | Accent | 强调某些音 | 有节奏感的强调 |
| 渐强 | Crescendo | 逐渐变强 | — |
| 渐弱 | Decrescendo | 逐渐变弱 | — |

你可以把它理解成"发音语气"。同样的字，用不同语气说，含义不同。

## Rest / 休止

休止表示：**不发音的时间**。

它不是无意义的空白，而是音乐的一部分。停顿会带来：

- 呼吸感
- 紧张感
- 对比
- 空间感

> 音乐中的沉默，和语言中的停顿一样重要。

## 表达层的意义

同一段旋律，同一组和弦：

- 弱奏 + 连奏 → 温柔、私密
- 强奏 + 断奏 → 有力、果断
- 渐强 + 加速 → 兴奋、紧迫

**表达层把"音符"变成"音乐"。**

## 下一步

→ [MIDI 与结构化表达](/midi/) — 用数据结构理解音乐
