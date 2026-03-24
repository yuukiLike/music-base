# 半音与全音 Half & Whole Steps

## 半音 (Semitone / Half Step)

半音是西方音乐中最小的音程单位。在钢琴上，从一个键到**紧邻**的下一个键（包括黑键）就是一个半音。

常见的半音：
- E → F（两个白键之间没有黑键）
- B → C（两个白键之间没有黑键）
- C → C#（白键到相邻黑键）
- F# → G（黑键到相邻白键）

## 全音 (Whole Tone / Whole Step)

全音 = 两个半音。在钢琴上，跳过一个键就是一个全音。

常见的全音：
- C → D（中间跳过了 C#）
- D → E（中间跳过了 D#）
- F → G（中间跳过了 F#）

## 为什么半音和全音重要？

所有的音阶和调式都可以用半音（H）和全音（W）的排列模式来描述：

- **大调音阶**：W-W-H-W-W-W-H
- **自然小调**：W-H-W-W-H-W-W

理解了半音和全音，你就掌握了构建任何音阶的密码。

<ClientOnly>
  <IntervalDemo />
</ClientOnly>

<script setup>
import IntervalDemo from '../.vitepress/components/IntervalDemo.vue'
</script>

## 相关主题

- [音程的分类](/intervals/classification) — 音程的更多分类方法
- [音阶](/scales/) — 用半音全音模式构建音阶
