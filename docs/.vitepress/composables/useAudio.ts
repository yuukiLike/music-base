/**
 * Vue composable for managing audio playback via Tone.js.
 * Provides a shared Sampler singleton with OscillatorNode fallback.
 */

import { ref, onMounted } from 'vue'
import * as Tone from 'tone'

const audioReady = ref(false)
const samplerLoaded = ref(false)
const needsActivation = ref(true)

let sampler: Tone.Sampler | null = null
let initPromise: Promise<void> | null = null

/** Initialize Tone.js AudioContext and load the piano sampler */
async function initAudio(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    await Tone.start()
    audioReady.value = true
    needsActivation.value = false

    sampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
        A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
        A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
        A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
        A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
        A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
        A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
        A7: 'A7.mp3', C8: 'C8.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        samplerLoaded.value = true
      },
    }).toDestination()
  })()

  return initPromise
}

/** Play a note using OscillatorNode as immediate fallback, sampler when ready */
function playNote(noteStr: string, duration = '8n'): void {
  if (!audioReady.value) return

  if (samplerLoaded.value && sampler) {
    sampler.triggerAttackRelease(noteStr, duration)
  } else {
    // OscillatorNode fallback for instant response before samples load
    playWithOscillator(noteStr)
  }
}

/** Play multiple notes simultaneously (chord) */
function playChord(notes: string[], duration = '2n'): void {
  if (!audioReady.value) return

  if (samplerLoaded.value && sampler) {
    sampler.triggerAttackRelease(notes, duration)
  } else {
    notes.forEach(n => playWithOscillator(n))
  }
}

/** Play notes sequentially with a delay between each */
function playSequence(notes: string[], interval = 0.4, duration = '8n'): void {
  if (!audioReady.value) return

  const now = Tone.now()
  notes.forEach((note, i) => {
    const time = now + i * interval
    if (samplerLoaded.value && sampler) {
      sampler.triggerAttackRelease(note, duration, time)
    } else {
      setTimeout(() => playWithOscillator(note), i * interval * 1000)
    }
  })
}

/** Simple OscillatorNode synth fallback */
function playWithOscillator(noteStr: string): void {
  const ctx = Tone.getContext().rawContext
  if (!ctx) return

  const match = noteStr.match(/^([A-G]#?)(\d+)$/)
  if (!match) return

  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
  }

  const semitone = noteMap[match[1]]
  if (semitone === undefined) return
  const octave = parseInt(match[2], 10)
  const midi = (octave + 1) * 12 + semitone
  const frequency = 440 * Math.pow(2, (midi - 69) / 12)

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.value = 0.3
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.8)
}

export function useAudio() {
  onMounted(() => {
    // Check if AudioContext is already running (user already interacted)
    if (Tone.getContext().state === 'running') {
      needsActivation.value = false
      audioReady.value = true
    }
  })

  async function activate(): Promise<void> {
    await initAudio()
  }

  return {
    audioReady,
    samplerLoaded,
    needsActivation,
    activate,
    playNote,
    playChord,
    playSequence,
  }
}
