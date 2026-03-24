# 音符、音高、八度

时间骨架讲完后，再进入"发什么音"。

## Note / 音符

音符你可以先理解为：**一次具体的声音事件**。

它通常至少包含两层信息：

- 发什么音（音高）
- 持续多久（时值）

所以音符不是只表示高低，也带时间属性。

## Pitch / 音高

音高表示：**这个音是高还是低**。

常见音名有 7 个：

```
C  D  E  F  G  A  B
```

如果再加八度编号，就会变成：

```
C3  C4  C5
```

它们都是 C，但高低不同。

在钢琴上试试 — 点击不同的键，听音高变化：

<ClientOnly>
  <Piano :range="[48, 72]" :interactive="true" @note-click="handleClick" />
</ClientOnly>

<script setup>
import { ref } from 'vue'
import Piano from '../.vitepress/components/Piano.vue'
import { useAudio } from '../.vitepress/composables/useAudio'

const { needsActivation, activate, playNote } = useAudio()

function handleClick(note) {
  if (needsActivation.value) {
    activate().then(() => playNote(note))
  } else {
    playNote(note)
  }
}
</script>

## Octave / 八度

八度可以先理解成：**同名音在不同高度层级上的重复**。

| 音名 | 含义 |
|------|------|
| C3 | 低区的 C |
| C4 | 中央 C（钢琴中间位置）|
| C5 | 高区的 C |

C3 和 C4 听起来"像同一个音但高了一层"。物理上，C4 的频率正好是 C3 的 2 倍。

## 半音与全音

在钢琴上，相邻两个键（包括黑键）的距离是**半音**（semitone）。

- E → F 是半音（中间没有黑键）
- B → C 是半音（中间没有黑键）
- C → C# 是半音
- C → D 是**全音** = 两个半音

半音是西方音乐中最小的距离单位。

## 升号与降号

- **#（升号 / Sharp）**：升高半音，C# 比 C 高半音
- **b（降号 / Flat）**：降低半音，Db 比 D 低半音

所以 C# 和 Db 实际上是同一个音高（在钢琴上是同一个键）。

## 12 个音

一个八度内有 **12 个半音**：

```
C  C#  D  D#  E  F  F#  G  G#  A  A#  B
```

然后从下一个 C 开始，重新循环。所有的音阶、和弦都是从这 12 个音中选取的。

## 下一步

→ [音程](/pitch/intervals) — 两个音之间的距离
