# 速查

## 高概率混淆点

### 节拍 vs 节奏
- **节拍 (Beat)**：底层均匀脉冲
- **节奏 (Rhythm)**：音如何落在这些脉冲上

### 音高 vs 音色
- **音高 (Pitch)**：高低
- **音色 (Timbre)**：质感

### 和弦 vs 和声
- **和弦 (Chord)**：某一刻同时响的音
- **和声 (Harmony)**：整体同时关系与推进

### 力度 vs 速度
- **力度 (Dynamics)**：强弱
- **速度 (Tempo)**：快慢

### 音符 vs 音高
- **音符 (Note)**：一次完整的声音事件（含音高 + 时值）
- **音高 (Pitch)**：只是音的高低属性

### 拍号 vs 速度
- **拍号 (Meter)**：拍怎么分组（4/4、3/4）
- **速度 (Tempo)**：拍有多快（BPM）

## 最小可用词汇表

| 中文 | 英文 | 一句话理解 |
|------|------|-----------|
| 拍 | beat | 稳定脉冲 |
| 速度 | tempo | 脉冲有多快 |
| 拍号 | meter / time signature | 拍怎么分组 |
| 小节 | bar / measure | 时间容器 |
| 时值 | duration | 持续多久 |
| 节奏 | rhythm | 音怎么落在时间上 |
| 音符 | note | 一次声音事件 |
| 音高 | pitch | 音的高低 |
| 八度 | octave | 同名音的不同高度 |
| 音程 | interval | 两个音的距离 |
| 音阶 | scale | 按顺序排列的一组音 |
| 调 | key | 音乐的重心 |
| 旋律 | melody | 横向的音线 |
| 和弦 | chord | 同时响的多个音 |
| 和声 | harmony | 和弦和整体同时关系 |
| 力度 | dynamics | 强弱 |
| 音色 | timbre | 声音质感 |
| 演奏法 | articulation | 怎么发音 |
| 休止 | rest | 有意义的停顿 |

## 总公式

> **音乐 = 时间轴上的声音事件集合**

每个事件至少有：

```
start          什么时候开始
duration       持续多久
pitch          发什么音
velocity       多强
timbre         什么质感
articulation   怎么发出来
```

## 学习路径总览

```
① 时间骨架    beat → tempo → meter → bar → duration
② 重复性      骨架重复，内容不必重复
③ 强弱拍      不是平的，有起伏
④ 节奏变化    同样格子，不同放法
⑤ 音高        note → pitch → octave → interval → scale → key
⑥ 横向纵向    melody → chord → harmony
⑦ 表达层      dynamics → timbre → articulation → rest
⑧ MIDI        结构化事件流
```

## 五度圈

五度圈是理解调性关系的核心工具。点击任意调，查看它的自然和弦：

<ClientOnly>
  <CircleOfFifths />
</ClientOnly>

<script setup>
import CircleOfFifths from '../.vitepress/components/CircleOfFifths.vue'
</script>

## 深入参考

如果你想深入某个具体话题：

- [音程详解](/intervals/) — 半音全音、分类、协和度、听辨
- [和弦详解](/chords/) — 大三小三、七和弦、挂留、转位、构建器
- [音阶详解](/scales/) — 大调、小调、教会调式、五声、布鲁斯
