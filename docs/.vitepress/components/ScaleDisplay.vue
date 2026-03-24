<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudio } from '../composables/useAudio'
import { getScaleTypes, getScaleNotes, midiToNote, noteToMidi } from '../utils/music'
import Piano from './Piano.vue'

const NOTE_OPTIONS = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']

const { needsActivation, activate, playNote, playSequence } = useAudio()

const rootNote = ref('C4')
const scaleType = ref('major')

const scaleTypes = getScaleTypes()

const scale = computed(() => getScaleNotes(rootNote.value, scaleType.value))

const highlightedNotes = computed(() => {
  if (!scale.value) return []
  return scale.value.notes.map(n => midiToNote(n.midi))
})

function handleNoteClick(note: string) {
  if (needsActivation.value) {
    activate()
  }
  playNote(note)
}

function playScale() {
  if (!scale.value) return

  if (needsActivation.value) {
    activate().then(() => doPlay())
  } else {
    doPlay()
  }
}

function doPlay() {
  if (!scale.value) return
  const notes = scale.value.notes.map(n => midiToNote(n.midi))
  playSequence(notes, 0.35)
}
</script>

<template>
  <div class="demo-container">
    <div v-if="needsActivation" class="audio-banner" @click="activate">
      点击启用音频 🔊
    </div>

    <div class="demo-controls">
      <label>
        根音：
        <select v-model="rootNote">
          <option v-for="n in NOTE_OPTIONS" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>

      <label>
        音阶：
        <select v-model="scaleType">
          <option v-for="s in scaleTypes" :key="s.type" :value="s.type">
            {{ s.zhName }} ({{ s.type }})
          </option>
        </select>
      </label>

      <button @click="playScale">▶ 播放音阶</button>
    </div>

    <Piano
      :highlighted="highlightedNotes"
      :root="midiToNote(noteToMidi(rootNote))"
      :range="[48, 72]"
      @note-click="handleNoteClick"
    />

    <div v-if="scale" class="demo-info">
      <p><strong>{{ scale.zhName }}</strong> ({{ scale.type }})</p>
      <p>音符：{{ highlightedNotes.join(' - ') }}</p>
      <p>音程模式：{{ scale.intervals.join(', ') }}</p>
    </div>
  </div>
</template>
