/**
 * Shared music theory data model and utility functions.
 * All interactive components use this module to avoid DRY violations.
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B'
}

export interface Note {
  name: string
  octave: number
  midi: number
  frequency: number
}

export interface Interval {
  semitones: number
  name: string
  quality: string
  zhName: string
}

export interface Scale {
  root: Note
  type: string
  zhName: string
  intervals: number[]
  notes: Note[]
}

export interface Chord {
  root: Note
  type: string
  zhName: string
  intervals: number[]
  notes: Note[]
}

/** Normalize flat notes to sharp equivalents */
export function normalizeNoteName(name: string): string {
  const match = name.match(/^([A-Ga-g][#b]?)(\d+)?$/)
  if (!match) return name
  const [, notePart, octave] = match
  const upper = notePart.charAt(0).toUpperCase() + notePart.slice(1)
  const normalized = FLAT_TO_SHARP[upper] ?? upper
  return octave ? `${normalized}${octave}` : normalized
}

/** Parse a note string like 'C4' into name and octave */
export function parseNote(noteStr: string): { name: string; octave: number } | null {
  const match = noteStr.match(/^([A-Ga-g][#b]?)(\d+)$/)
  if (!match) return null
  const name = normalizeNoteName(match[1])
  const octave = parseInt(match[2], 10)
  return { name, octave }
}

/** Convert a note name + octave to MIDI number. C4 = 60 */
export function noteToMidi(noteStr: string): number {
  const parsed = parseNote(noteStr)
  if (!parsed) return -1
  const { name, octave } = parsed
  const index = NOTE_NAMES.indexOf(name as typeof NOTE_NAMES[number])
  if (index === -1) return -1
  return (octave + 1) * 12 + index
}

/** Convert MIDI number to frequency in Hz. A4 (69) = 440 Hz */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Convert MIDI number to note string like 'C4' */
export function midiToNote(midi: number): string {
  if (midi < 0 || midi > 127) return ''
  const name = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

/** Create a full Note object from a note string */
export function createNote(noteStr: string): Note | null {
  const parsed = parseNote(noteStr)
  if (!parsed) return null
  const midi = noteToMidi(noteStr)
  return {
    name: parsed.name,
    octave: parsed.octave,
    midi,
    frequency: midiToFrequency(midi)
  }
}

/** Get all notes in a MIDI range */
export function getNotesInRange(startMidi: number, endMidi: number): Note[] {
  const notes: Note[] = []
  for (let midi = startMidi; midi <= endMidi; midi++) {
    const name = NOTE_NAMES[midi % 12]
    const octave = Math.floor(midi / 12) - 1
    notes.push({ name, octave, midi, frequency: midiToFrequency(midi) })
  }
  return notes
}

/** Check if a MIDI note is a black key */
export function isBlackKey(midi: number): boolean {
  const n = midi % 12
  return [1, 3, 6, 8, 10].includes(n)
}

// --- Intervals ---

const INTERVAL_NAMES: Record<number, { name: string; quality: string; zhName: string }> = {
  0:  { name: 'Unison',            quality: 'Perfect',    zhName: '纯一度' },
  1:  { name: 'Minor 2nd',         quality: 'Minor',      zhName: '小二度' },
  2:  { name: 'Major 2nd',         quality: 'Major',      zhName: '大二度' },
  3:  { name: 'Minor 3rd',         quality: 'Minor',      zhName: '小三度' },
  4:  { name: 'Major 3rd',         quality: 'Major',      zhName: '大三度' },
  5:  { name: 'Perfect 4th',       quality: 'Perfect',    zhName: '纯四度' },
  6:  { name: 'Tritone',           quality: 'Augmented',  zhName: '增四度/减五度' },
  7:  { name: 'Perfect 5th',       quality: 'Perfect',    zhName: '纯五度' },
  8:  { name: 'Minor 6th',         quality: 'Minor',      zhName: '小六度' },
  9:  { name: 'Major 6th',         quality: 'Major',      zhName: '大六度' },
  10: { name: 'Minor 7th',         quality: 'Minor',      zhName: '小七度' },
  11: { name: 'Major 7th',         quality: 'Major',      zhName: '大七度' },
  12: { name: 'Octave',            quality: 'Perfect',    zhName: '纯八度' },
}

/** Get the interval between two notes (by MIDI or note string) */
export function getInterval(note1: string | number, note2: string | number): Interval {
  const midi1 = typeof note1 === 'string' ? noteToMidi(note1) : note1
  const midi2 = typeof note2 === 'string' ? noteToMidi(note2) : note2
  const semitones = Math.abs(midi2 - midi1) % 13
  const info = INTERVAL_NAMES[semitones] ?? { name: `${semitones} semitones`, quality: 'Other', zhName: `${semitones}个半音` }
  return { semitones, ...info }
}

/** Get all 12 intervals from a root note */
export function getAllIntervals(root: string): Array<Interval & { note: string }> {
  const rootMidi = noteToMidi(root)
  if (rootMidi === -1) return []
  return Array.from({ length: 13 }, (_, i) => ({
    ...getInterval(rootMidi, rootMidi + i),
    note: midiToNote(rootMidi + i)
  }))
}

// --- Scales ---

const SCALE_TYPES: Record<string, { intervals: number[]; zhName: string }> = {
  'major':            { intervals: [0, 2, 4, 5, 7, 9, 11], zhName: '大调' },
  'natural-minor':    { intervals: [0, 2, 3, 5, 7, 8, 10], zhName: '自然小调' },
  'harmonic-minor':   { intervals: [0, 2, 3, 5, 7, 8, 11], zhName: '和声小调' },
  'melodic-minor':    { intervals: [0, 2, 3, 5, 7, 9, 11], zhName: '旋律小调' },
  'dorian':           { intervals: [0, 2, 3, 5, 7, 9, 10], zhName: '多利亚调式' },
  'phrygian':         { intervals: [0, 1, 3, 5, 7, 8, 10], zhName: '弗里几亚调式' },
  'lydian':           { intervals: [0, 2, 4, 6, 7, 9, 11], zhName: '利底亚调式' },
  'mixolydian':       { intervals: [0, 2, 4, 5, 7, 9, 10], zhName: '混合利底亚调式' },
  'pentatonic-major': { intervals: [0, 2, 4, 7, 9],         zhName: '大调五声音阶' },
  'pentatonic-minor': { intervals: [0, 3, 5, 7, 10],        zhName: '小调五声音阶' },
  'blues':            { intervals: [0, 3, 5, 6, 7, 10],     zhName: '布鲁斯音阶' },
  'chromatic':        { intervals: [0,1,2,3,4,5,6,7,8,9,10,11], zhName: '半音阶' },
}

export function getScaleTypes(): Array<{ type: string; zhName: string }> {
  return Object.entries(SCALE_TYPES).map(([type, { zhName }]) => ({ type, zhName }))
}

export function getScaleNotes(root: string, scaleType: string): Scale | null {
  const rootNote = createNote(root)
  if (!rootNote) return null
  const scaleInfo = SCALE_TYPES[scaleType]
  if (!scaleInfo) return null
  const notes = scaleInfo.intervals.map(i => {
    const midi = rootNote.midi + i
    return { name: NOTE_NAMES[midi % 12], octave: Math.floor(midi / 12) - 1, midi, frequency: midiToFrequency(midi) }
  })
  return { root: rootNote, type: scaleType, zhName: scaleInfo.zhName, intervals: scaleInfo.intervals, notes }
}

// --- Chords ---

const CHORD_TYPES: Record<string, { intervals: number[]; zhName: string }> = {
  'major':       { intervals: [0, 4, 7],      zhName: '大三和弦' },
  'minor':       { intervals: [0, 3, 7],      zhName: '小三和弦' },
  'diminished':  { intervals: [0, 3, 6],      zhName: '减三和弦' },
  'augmented':   { intervals: [0, 4, 8],      zhName: '增三和弦' },
  'major7':      { intervals: [0, 4, 7, 11],  zhName: '大七和弦' },
  'minor7':      { intervals: [0, 3, 7, 10],  zhName: '小七和弦' },
  'dominant7':   { intervals: [0, 4, 7, 10],  zhName: '属七和弦' },
  'diminished7': { intervals: [0, 3, 6, 9],   zhName: '减七和弦' },
  'half-dim7':   { intervals: [0, 3, 6, 10],  zhName: '半减七和弦' },
  'sus2':        { intervals: [0, 2, 7],      zhName: '挂二和弦' },
  'sus4':        { intervals: [0, 5, 7],      zhName: '挂四和弦' },
  'add9':        { intervals: [0, 4, 7, 14],  zhName: '加九和弦' },
}

export function getChordTypes(): Array<{ type: string; zhName: string }> {
  return Object.entries(CHORD_TYPES).map(([type, { zhName }]) => ({ type, zhName }))
}

export function getChordNotes(root: string, chordType: string): Chord | null {
  const rootNote = createNote(root)
  if (!rootNote) return null
  const chordInfo = CHORD_TYPES[chordType]
  if (!chordInfo) return null
  const notes = chordInfo.intervals.map(i => {
    const midi = rootNote.midi + i
    return { name: NOTE_NAMES[midi % 12], octave: Math.floor(midi / 12) - 1, midi, frequency: midiToFrequency(midi) }
  })
  return { root: rootNote, type: chordType, zhName: chordInfo.zhName, intervals: chordInfo.intervals, notes }
}
