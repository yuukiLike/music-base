<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAudio } from '../composables/useAudio'
import { getAllIntervals, midiToNote, noteToMidi } from '../utils/music'
import Piano from './Piano.vue'

const NOTE_OPTIONS = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']

const { audioReady, needsActivation, activate, playNote, playSequence } = useAudio()

const rootNote = ref('C4')
const selectedInterval = ref(0)

const intervals = computed(() => getAllIntervals(rootNote.value))

const currentInterval = computed(() => intervals.value[selectedInterval.value])

const highlightedNotes = computed(() => {
  if (!currentInterval.value) return []
  const rootMidi = noteToMidi(rootNote.value)
  return [
    midiToNote(rootMidi),
    midiToNote(rootMidi + selectedInterval.value),
  ]
})

function handleNoteClick(note: string) {
  if (needsActivation.value) {
    activate()
  }
  playNote(note)
}

function playInterval() {
  if (needsActivation.value) {
    activate().then(() => doPlay())
  } else {
    doPlay()
  }
}

function doPlay() {
  const rootMidi = noteToMidi(rootNote.value)
  const notes = [
    midiToNote(rootMidi),
    midiToNote(rootMidi + selectedInterval.value),
  ]
  playSequence(notes, 0.5)
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
        音程：
        <select v-model.number="selectedInterval">
          <option v-for="(iv, i) in intervals" :key="i" :value="i">
            {{ iv.zhName }} ({{ iv.name }})
          </option>
        </select>
      </label>

      <button @click="playInterval">▶ 播放音程</button>
    </div>

    <Piano
      :highlighted="highlightedNotes"
      :root="midiToNote(noteToMidi(rootNote))"
      :range="[48, 72]"
      @note-click="handleNoteClick"
    />

    <div v-if="currentInterval" class="demo-info">
      <p><strong>{{ currentInterval.zhName }}</strong> ({{ currentInterval.name }})</p>
      <p>半音数：{{ currentInterval.semitones }} | 性质：{{ currentInterval.quality }}</p>
      <p>音符：{{ highlightedNotes.join(' → ') }}</p>
    </div>
  </div>
</template>
