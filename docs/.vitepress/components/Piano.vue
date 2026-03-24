<script setup lang="ts">
import { computed } from 'vue'
import { isBlackKey, midiToNote } from '../utils/music'

const props = withDefaults(defineProps<{
  highlighted?: string[]
  root?: string
  range?: [number, number]
  interactive?: boolean
}>(), {
  highlighted: () => [],
  root: undefined,
  range: () => [48, 72] as [number, number],
  interactive: true,
})

const emit = defineEmits<{
  'note-click': [note: string]
}>()

interface PianoKey {
  midi: number
  note: string
  isBlack: boolean
  x: number
  isHighlighted: boolean
  isRoot: boolean
}

const WHITE_KEY_WIDTH = 28
const WHITE_KEY_HEIGHT = 120
const BLACK_KEY_WIDTH = 18
const BLACK_KEY_HEIGHT = 75

const keys = computed<PianoKey[]>(() => {
  const [start, end] = props.range
  const allKeys: PianoKey[] = []
  let whiteIndex = 0

  // First pass: count white keys for layout
  const whitePositions: Record<number, number> = {}
  for (let midi = start; midi <= end; midi++) {
    if (!isBlackKey(midi)) {
      whitePositions[midi] = whiteIndex
      whiteIndex++
    }
  }

  // Second pass: build key objects
  for (let midi = start; midi <= end; midi++) {
    const note = midiToNote(midi)
    const black = isBlackKey(midi)
    let x: number

    if (black) {
      // Position black key between the two surrounding white keys
      const prevWhiteMidi = midi - 1
      const prevWhitePos = whitePositions[prevWhiteMidi]
      if (prevWhitePos !== undefined) {
        x = (prevWhitePos + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
      } else {
        x = 0
      }
    } else {
      x = whitePositions[midi] * WHITE_KEY_WIDTH
    }

    allKeys.push({
      midi,
      note,
      isBlack: black,
      x,
      isHighlighted: props.highlighted.includes(note),
      isRoot: props.root === note,
    })
  }

  return allKeys
})

const whiteKeys = computed(() => keys.value.filter(k => !k.isBlack))
const blackKeys = computed(() => keys.value.filter(k => k.isBlack))

const svgWidth = computed(() => {
  return whiteKeys.value.length * WHITE_KEY_WIDTH
})

function handleClick(note: string) {
  if (props.interactive) {
    emit('note-click', note)
  }
}
</script>

<template>
  <div class="piano-wrapper">
    <svg
      :viewBox="`0 0 ${svgWidth} ${WHITE_KEY_HEIGHT}`"
      :width="svgWidth"
      :height="WHITE_KEY_HEIGHT"
      class="piano-svg"
    >
      <!-- White keys first (behind black keys) -->
      <g v-for="key in whiteKeys" :key="key.midi">
        <rect
          :x="key.x"
          y="0"
          :width="WHITE_KEY_WIDTH"
          :height="WHITE_KEY_HEIGHT"
          :class="[
            'piano-key white-key',
            { highlighted: key.isHighlighted, root: key.isRoot, interactive: interactive }
          ]"
          rx="2"
          @click="handleClick(key.note)"
        />
        <text
          v-if="key.isHighlighted || key.isRoot"
          :x="key.x + WHITE_KEY_WIDTH / 2"
          :y="WHITE_KEY_HEIGHT - 10"
          class="key-label"
          text-anchor="middle"
        >
          {{ key.note.replace(/\d+/, '') }}
        </text>
      </g>

      <!-- Black keys on top -->
      <g v-for="key in blackKeys" :key="key.midi">
        <rect
          :x="key.x"
          y="0"
          :width="BLACK_KEY_WIDTH"
          :height="BLACK_KEY_HEIGHT"
          :class="[
            'piano-key black-key',
            { highlighted: key.isHighlighted, root: key.isRoot, interactive: interactive }
          ]"
          rx="2"
          @click="handleClick(key.note)"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.piano-wrapper {
  overflow-x: auto;
  padding: 12px 0;
}

.piano-svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.piano-key {
  stroke: #333;
  stroke-width: 1;
  transition: fill 0.1s ease;
}

.white-key {
  fill: #fff;
}

.white-key.interactive:hover {
  fill: #f0f0f0;
  cursor: pointer;
}

.white-key.highlighted {
  fill: var(--vp-c-brand-1, #3451b2);
  opacity: 0.7;
}

.white-key.root {
  fill: var(--vp-c-brand-1, #3451b2);
  opacity: 1;
}

.black-key {
  fill: #222;
}

.black-key.interactive:hover {
  fill: #444;
  cursor: pointer;
}

.black-key.highlighted {
  fill: var(--vp-c-brand-2, #5672cd);
  opacity: 0.85;
}

.black-key.root {
  fill: var(--vp-c-brand-1, #3451b2);
  opacity: 1;
}

.key-label {
  font-size: 10px;
  fill: #fff;
  pointer-events: none;
  font-family: var(--vp-font-family-base);
}
</style>
