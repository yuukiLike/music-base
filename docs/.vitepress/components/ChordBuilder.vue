<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudio } from '../composables/useAudio'
import { getChordTypes, getChordNotes, midiToNote, noteToMidi } from '../utils/music'
import Piano from './Piano.vue'

const NOTE_OPTIONS = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']

const { needsActivation, activate, playNote, playChord } = useAudio()

const rootNote = ref('C4')
const chordType = ref('major')

const chordTypes = getChordTypes()

const chord = computed(() => getChordNotes(rootNote.value, chordType.value))

const highlightedNotes = computed(() => {
  if (!chord.value) return []
  return chord.value.notes.map(n => midiToNote(n.midi))
})

function handleNoteClick(note: string) {
  if (needsActivation.value) {
    activate()
  }
  playNote(note)
}

function playChordNow() {
  if (!chord.value) return

  if (needsActivation.value) {
    activate().then(() => doPlay())
  } else {
    doPlay()
  }
}

function doPlay() {
  if (!chord.value) return
  const notes = chord.value.notes.map(n => midiToNote(n.midi))
  playChord(notes)
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
        和弦：
        <select v-model="chordType">
          <option v-for="c in chordTypes" :key="c.type" :value="c.type">
            {{ c.zhName }} ({{ c.type }})
          </option>
        </select>
      </label>

      <button @click="playChordNow">▶ 播放和弦</button>
    </div>

    <Piano
      :highlighted="highlightedNotes"
      :root="midiToNote(noteToMidi(rootNote))"
      :range="[48, 72]"
      @note-click="handleNoteClick"
    />

    <div v-if="chord" class="demo-info">
      <p><strong>{{ chord.zhName }}</strong> ({{ chord.type }})</p>
      <p>组成音：{{ highlightedNotes.join(' - ') }}</p>
      <p>音程结构：{{ chord.intervals.join(', ') }}</p>
    </div>
  </div>
</template>
