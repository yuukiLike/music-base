<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudio } from '../composables/useAudio'
import { midiToNote, noteToMidi } from '../utils/music'

const { audioReady, needsActivation, activate, playNote, playSequence, playChord } = useAudio()

type Mode = 'interval' | 'chord'

const mode = ref<Mode>('interval')
const score = ref({ correct: 0, total: 0 })
const status = ref<'idle' | 'playing' | 'waiting' | 'answered'>('idle')
const feedback = ref<'correct' | 'wrong' | null>(null)
const currentAnswer = ref('')
const userAnswer = ref('')
const streak = ref(0)
const bestStreak = ref(0)

const INTERVALS = [
  { semitones: 1, label: '小二度', en: 'm2' },
  { semitones: 2, label: '大二度', en: 'M2' },
  { semitones: 3, label: '小三度', en: 'm3' },
  { semitones: 4, label: '大三度', en: 'M3' },
  { semitones: 5, label: '纯四度', en: 'P4' },
  { semitones: 6, label: '三全音', en: 'TT' },
  { semitones: 7, label: '纯五度', en: 'P5' },
  { semitones: 8, label: '小六度', en: 'm6' },
  { semitones: 9, label: '大六度', en: 'M6' },
  { semitones: 10, label: '小七度', en: 'm7' },
  { semitones: 11, label: '大七度', en: 'M7' },
  { semitones: 12, label: '纯八度', en: 'P8' },
]

const CHORD_TYPES = [
  { intervals: [0, 4, 7], label: '大三和弦', en: 'Major' },
  { intervals: [0, 3, 7], label: '小三和弦', en: 'Minor' },
  { intervals: [0, 3, 6], label: '减三和弦', en: 'Dim' },
  { intervals: [0, 4, 8], label: '增三和弦', en: 'Aug' },
  { intervals: [0, 4, 7, 11], label: '大七和弦', en: 'Maj7' },
  { intervals: [0, 3, 7, 10], label: '小七和弦', en: 'Min7' },
  { intervals: [0, 4, 7, 10], label: '属七和弦', en: 'Dom7' },
]

const difficulty = ref<'easy' | 'medium' | 'hard'>('easy')

const intervalPool = computed(() => {
  if (difficulty.value === 'easy') {
    return INTERVALS.filter(i => [3, 4, 5, 7, 12].includes(i.semitones))
  }
  if (difficulty.value === 'medium') {
    return INTERVALS.filter(i => [1, 2, 3, 4, 5, 7, 8, 12].includes(i.semitones))
  }
  return INTERVALS
})

const chordPool = computed(() => {
  if (difficulty.value === 'easy') {
    return CHORD_TYPES.slice(0, 2) // major, minor
  }
  if (difficulty.value === 'medium') {
    return CHORD_TYPES.slice(0, 4) // + dim, aug
  }
  return CHORD_TYPES
})

const options = computed(() => {
  return mode.value === 'interval' ? intervalPool.value : chordPool.value
})

const accuracy = computed(() => {
  if (score.value.total === 0) return 0
  return Math.round((score.value.correct / score.value.total) * 100)
})

let questionData: { rootMidi: number; answer: string } | null = null

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function startQuestion() {
  if (needsActivation.value) {
    await activate()
  }

  feedback.value = null
  userAnswer.value = ''
  status.value = 'playing'

  const rootMidi = randomInt(48, 65)
  const pool = options.value
  const chosen = pool[randomInt(0, pool.length - 1)]

  currentAnswer.value = chosen.label
  questionData = { rootMidi, answer: chosen.label }

  if (mode.value === 'interval') {
    const iv = chosen as typeof INTERVALS[number]
    const note1 = midiToNote(rootMidi)
    const note2 = midiToNote(rootMidi + iv.semitones)
    playSequence([note1, note2], 0.6, '4n')
  } else {
    const ch = chosen as typeof CHORD_TYPES[number]
    const notes = ch.intervals.map(i => midiToNote(rootMidi + i))
    playChord(notes, '2n')
  }

  setTimeout(() => {
    status.value = 'waiting'
  }, mode.value === 'interval' ? 1400 : 800)
}

function replay() {
  if (!questionData || status.value === 'answered') return

  const rootMidi = questionData.rootMidi
  const pool = options.value
  const chosen = pool.find(p => p.label === questionData!.answer)
  if (!chosen) return

  if (mode.value === 'interval') {
    const iv = chosen as typeof INTERVALS[number]
    playSequence([midiToNote(rootMidi), midiToNote(rootMidi + iv.semitones)], 0.6, '4n')
  } else {
    const ch = chosen as typeof CHORD_TYPES[number]
    const notes = ch.intervals.map(i => midiToNote(rootMidi + i))
    playChord(notes, '2n')
  }
}

function answer(label: string) {
  if (status.value !== 'waiting') return

  userAnswer.value = label
  status.value = 'answered'
  score.value.total++

  if (label === currentAnswer.value) {
    feedback.value = 'correct'
    score.value.correct++
    streak.value++
    if (streak.value > bestStreak.value) {
      bestStreak.value = streak.value
    }
  } else {
    feedback.value = 'wrong'
    streak.value = 0
  }
}

function reset() {
  score.value = { correct: 0, total: 0 }
  streak.value = 0
  status.value = 'idle'
  feedback.value = null
  questionData = null
}
</script>

<template>
  <div class="demo-container ear-game">
    <div v-if="needsActivation && status === 'idle'" class="audio-banner" @click="activate">
      点击启用音频
    </div>

    <!-- Mode & difficulty -->
    <div class="game-header">
      <div class="mode-switch">
        <button
          :class="['mode-btn', { active: mode === 'interval' }]"
          @click="mode = 'interval'; reset()"
        >音程</button>
        <button
          :class="['mode-btn', { active: mode === 'chord' }]"
          @click="mode = 'chord'; reset()"
        >和弦</button>
      </div>
      <div class="diff-switch">
        <button
          v-for="d in (['easy', 'medium', 'hard'] as const)"
          :key="d"
          :class="['diff-btn', { active: difficulty === d }]"
          @click="difficulty = d; reset()"
        >
          {{ d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难' }}
        </button>
      </div>
    </div>

    <!-- Score bar -->
    <div class="score-bar">
      <span class="score-item">
        <span class="score-num">{{ score.correct }}</span> / {{ score.total }}
      </span>
      <span class="score-item">
        正确率 <span class="score-num">{{ accuracy }}%</span>
      </span>
      <span class="score-item">
        连击 <span class="score-num streak" :class="{ hot: streak >= 5 }">{{ streak }}</span>
      </span>
    </div>

    <!-- Question area -->
    <div class="question-area">
      <div v-if="status === 'idle'" class="start-prompt">
        <button class="start-btn" @click="startQuestion">
          开始训练
        </button>
        <p class="start-hint">
          {{ mode === 'interval' ? '听两个音，判断音程' : '听和弦，判断类型' }}
        </p>
      </div>

      <div v-else class="active-question">
        <div class="play-controls">
          <button
            class="replay-btn"
            @click="replay"
            :disabled="status === 'playing' || status === 'answered'"
          >
            再听一次
          </button>
          <span v-if="status === 'playing'" class="listening">正在播放...</span>
        </div>

        <!-- Answer options -->
        <div class="options-grid">
          <button
            v-for="opt in options"
            :key="opt.label"
            :class="[
              'option-btn',
              {
                selected: userAnswer === opt.label,
                correct: status === 'answered' && opt.label === currentAnswer,
                wrong: status === 'answered' && userAnswer === opt.label && opt.label !== currentAnswer,
              }
            ]"
            :disabled="status !== 'waiting'"
            @click="answer(opt.label)"
          >
            <span class="opt-zh">{{ opt.label }}</span>
            <span class="opt-en">{{ opt.en }}</span>
          </button>
        </div>

        <!-- Feedback -->
        <div v-if="status === 'answered'" class="feedback-area">
          <div :class="['feedback-msg', feedback]">
            {{ feedback === 'correct' ? '正确!' : `错了 — 答案是 ${currentAnswer}` }}
          </div>
          <button class="next-btn" @click="startQuestion">
            下一题
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ear-game {
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.mode-switch, .diff-switch {
  display: flex;
  gap: 4px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 3px;
}

.mode-btn, .diff-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.mode-btn.active, .diff-btn.active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.score-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 10px;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
}

.score-num {
  font-weight: 700;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.streak.hot {
  color: #f59e0b;
}

.question-area {
  min-height: 200px;
}

.start-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
}

.start-btn {
  padding: 14px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.start-hint {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.play-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.replay-btn {
  padding: 8px 20px;
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 8px;
  background: transparent;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s;
}

.replay-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
}

.replay-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.listening {
  color: var(--vp-c-brand-1);
  font-size: 0.85rem;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  cursor: pointer;
  transition: all 0.15s;
}

.option-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-bg-soft);
}

.option-btn:disabled {
  cursor: default;
}

.option-btn.correct {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.option-btn.wrong {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.opt-zh {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.opt-en {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.feedback-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.feedback-msg {
  font-weight: 600;
  font-size: 0.95rem;
}

.feedback-msg.correct {
  color: #22c55e;
}

.feedback-msg.wrong {
  color: #ef4444;
}

.next-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: #fff;
  cursor: pointer;
  font-size: 0.88rem;
  transition: transform 0.15s;
}

.next-btn:hover {
  transform: translateY(-1px);
}

@media (max-width: 640px) {
  .game-header {
    flex-direction: column;
  }
  .score-bar {
    gap: 14px;
    font-size: 0.82rem;
  }
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
