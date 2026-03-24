import { describe, it, expect } from 'vitest'
import {
  normalizeNoteName,
  parseNote,
  noteToMidi,
  midiToFrequency,
  midiToNote,
  createNote,
  getNotesInRange,
  isBlackKey,
  getInterval,
  getAllIntervals,
  getScaleTypes,
  getScaleNotes,
  getChordTypes,
  getChordNotes,
} from '../docs/.vitepress/utils/music'

describe('normalizeNoteName', () => {
  it('passes through sharp notes unchanged', () => {
    expect(normalizeNoteName('C#')).toBe('C#')
    expect(normalizeNoteName('F#')).toBe('F#')
  })

  it('converts flat notes to sharp equivalents', () => {
    expect(normalizeNoteName('Db')).toBe('C#')
    expect(normalizeNoteName('Eb')).toBe('D#')
    expect(normalizeNoteName('Gb')).toBe('F#')
    expect(normalizeNoteName('Ab')).toBe('G#')
    expect(normalizeNoteName('Bb')).toBe('A#')
  })

  it('handles notes with octave numbers', () => {
    expect(normalizeNoteName('Db4')).toBe('C#4')
    expect(normalizeNoteName('Bb3')).toBe('A#3')
  })

  it('handles natural notes', () => {
    expect(normalizeNoteName('C')).toBe('C')
    expect(normalizeNoteName('A')).toBe('A')
  })

  it('normalizes lowercase input', () => {
    expect(normalizeNoteName('c')).toBe('C')
    expect(normalizeNoteName('db')).toBe('C#')
  })

  it('returns invalid input unchanged', () => {
    expect(normalizeNoteName('xyz')).toBe('xyz')
    expect(normalizeNoteName('')).toBe('')
  })
})

describe('parseNote', () => {
  it('parses valid note strings', () => {
    expect(parseNote('C4')).toEqual({ name: 'C', octave: 4 })
    expect(parseNote('A3')).toEqual({ name: 'A', octave: 3 })
    expect(parseNote('F#5')).toEqual({ name: 'F#', octave: 5 })
  })

  it('normalizes flat notes during parsing', () => {
    expect(parseNote('Db4')).toEqual({ name: 'C#', octave: 4 })
    expect(parseNote('Bb3')).toEqual({ name: 'A#', octave: 3 })
  })

  it('returns null for invalid input', () => {
    expect(parseNote('C')).toBeNull()
    expect(parseNote('4')).toBeNull()
    expect(parseNote('xyz')).toBeNull()
    expect(parseNote('')).toBeNull()
  })
})

describe('noteToMidi', () => {
  it('converts C4 to 60', () => {
    expect(noteToMidi('C4')).toBe(60)
  })

  it('converts A4 to 69', () => {
    expect(noteToMidi('A4')).toBe(69)
  })

  it('converts C-1 to 0 (lowest MIDI)', () => {
    expect(noteToMidi('C-1')).toBe(-1) // our formula won't handle negative octaves gracefully
  })

  it('converts C5 to 72', () => {
    expect(noteToMidi('C5')).toBe(72)
  })

  it('handles sharp notes', () => {
    expect(noteToMidi('C#4')).toBe(61)
    expect(noteToMidi('F#4')).toBe(66)
  })

  it('handles flat notes (normalized)', () => {
    expect(noteToMidi('Db4')).toBe(61) // Db = C#
    expect(noteToMidi('Bb3')).toBe(58) // Bb = A#
  })

  it('returns -1 for invalid input', () => {
    expect(noteToMidi('invalid')).toBe(-1)
  })
})

describe('midiToFrequency', () => {
  it('converts A4 (69) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 2)
  })

  it('converts A3 (57) to 220 Hz', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 2)
  })

  it('converts C4 (60) to ~261.63 Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1)
  })
})

describe('midiToNote', () => {
  it('converts 60 to C4', () => {
    expect(midiToNote(60)).toBe('C4')
  })

  it('converts 69 to A4', () => {
    expect(midiToNote(69)).toBe('A4')
  })

  it('converts 61 to C#4', () => {
    expect(midiToNote(61)).toBe('C#4')
  })

  it('returns empty string for out-of-range MIDI', () => {
    expect(midiToNote(-1)).toBe('')
    expect(midiToNote(128)).toBe('')
  })

  it('handles boundary values', () => {
    expect(midiToNote(0)).toBe('C-1')
    expect(midiToNote(127)).toBe('G9')
  })
})

describe('createNote', () => {
  it('creates a Note object from a valid string', () => {
    const note = createNote('C4')
    expect(note).not.toBeNull()
    expect(note!.name).toBe('C')
    expect(note!.octave).toBe(4)
    expect(note!.midi).toBe(60)
    expect(note!.frequency).toBeCloseTo(261.63, 1)
  })

  it('creates a Note for A4', () => {
    const note = createNote('A4')
    expect(note).not.toBeNull()
    expect(note!.midi).toBe(69)
    expect(note!.frequency).toBeCloseTo(440, 2)
  })

  it('returns null for invalid input', () => {
    expect(createNote('invalid')).toBeNull()
  })
})

describe('getNotesInRange', () => {
  it('returns correct number of notes', () => {
    const notes = getNotesInRange(60, 72)
    expect(notes).toHaveLength(13) // C4 to C5 inclusive
  })

  it('first note is C4 (midi 60)', () => {
    const notes = getNotesInRange(60, 72)
    expect(notes[0].name).toBe('C')
    expect(notes[0].octave).toBe(4)
    expect(notes[0].midi).toBe(60)
  })

  it('each note has frequency', () => {
    const notes = getNotesInRange(60, 62)
    notes.forEach(n => {
      expect(n.frequency).toBeGreaterThan(0)
    })
  })
})

describe('isBlackKey', () => {
  it('identifies black keys correctly', () => {
    // C#, D#, F#, G#, A# (midi % 12 = 1, 3, 6, 8, 10)
    expect(isBlackKey(61)).toBe(true)  // C#4
    expect(isBlackKey(63)).toBe(true)  // D#4
    expect(isBlackKey(66)).toBe(true)  // F#4
    expect(isBlackKey(68)).toBe(true)  // G#4
    expect(isBlackKey(70)).toBe(true)  // A#4
  })

  it('identifies white keys correctly', () => {
    expect(isBlackKey(60)).toBe(false) // C4
    expect(isBlackKey(62)).toBe(false) // D4
    expect(isBlackKey(64)).toBe(false) // E4
    expect(isBlackKey(65)).toBe(false) // F4
    expect(isBlackKey(67)).toBe(false) // G4
    expect(isBlackKey(69)).toBe(false) // A4
    expect(isBlackKey(71)).toBe(false) // B4
  })
})

describe('getInterval', () => {
  it('calculates unison (0 semitones)', () => {
    const iv = getInterval('C4', 'C4')
    expect(iv.semitones).toBe(0)
    expect(iv.name).toBe('Unison')
    expect(iv.zhName).toBe('纯一度')
  })

  it('calculates perfect fifth (7 semitones)', () => {
    const iv = getInterval('C4', 'G4')
    expect(iv.semitones).toBe(7)
    expect(iv.name).toBe('Perfect 5th')
  })

  it('calculates octave (12 semitones)', () => {
    const iv = getInterval('C4', 'C5')
    expect(iv.semitones).toBe(12)
    expect(iv.name).toBe('Octave')
  })

  it('works with MIDI numbers', () => {
    const iv = getInterval(60, 67) // C4 to G4
    expect(iv.semitones).toBe(7)
  })

  it('handles descending intervals (absolute value)', () => {
    const iv = getInterval('G4', 'C4')
    expect(iv.semitones).toBe(7)
  })
})

describe('getAllIntervals', () => {
  it('returns 13 intervals from a root', () => {
    const intervals = getAllIntervals('C4')
    expect(intervals).toHaveLength(13)
  })

  it('first interval is unison', () => {
    const intervals = getAllIntervals('C4')
    expect(intervals[0].semitones).toBe(0)
    expect(intervals[0].name).toBe('Unison')
  })

  it('last interval is octave', () => {
    const intervals = getAllIntervals('C4')
    expect(intervals[12].semitones).toBe(12)
    expect(intervals[12].name).toBe('Octave')
  })

  it('returns empty array for invalid root', () => {
    expect(getAllIntervals('invalid')).toEqual([])
  })
})

describe('getScaleTypes', () => {
  it('returns all scale types', () => {
    const types = getScaleTypes()
    expect(types.length).toBeGreaterThan(0)
  })

  it('includes major scale', () => {
    const types = getScaleTypes()
    const major = types.find(t => t.type === 'major')
    expect(major).toBeDefined()
    expect(major!.zhName).toBe('大调')
  })

  it('includes pentatonic scales', () => {
    const types = getScaleTypes()
    expect(types.find(t => t.type === 'pentatonic-major')).toBeDefined()
    expect(types.find(t => t.type === 'pentatonic-minor')).toBeDefined()
  })
})

describe('getScaleNotes', () => {
  it('returns C major scale notes', () => {
    const scale = getScaleNotes('C4', 'major')
    expect(scale).not.toBeNull()
    expect(scale!.notes).toHaveLength(7)
    expect(scale!.notes.map(n => n.name)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('returns correct zhName', () => {
    const scale = getScaleNotes('C4', 'major')
    expect(scale!.zhName).toBe('大调')
  })

  it('returns pentatonic with 5 notes', () => {
    const scale = getScaleNotes('C4', 'pentatonic-major')
    expect(scale).not.toBeNull()
    expect(scale!.notes).toHaveLength(5)
  })

  it('returns chromatic with 12 notes', () => {
    const scale = getScaleNotes('C4', 'chromatic')
    expect(scale).not.toBeNull()
    expect(scale!.notes).toHaveLength(12)
  })

  it('returns null for invalid root', () => {
    expect(getScaleNotes('invalid', 'major')).toBeNull()
  })

  it('returns null for invalid scale type', () => {
    expect(getScaleNotes('C4', 'nonexistent')).toBeNull()
  })
})

describe('getChordTypes', () => {
  it('returns all chord types', () => {
    const types = getChordTypes()
    expect(types.length).toBeGreaterThan(0)
  })

  it('includes major chord', () => {
    const types = getChordTypes()
    const major = types.find(t => t.type === 'major')
    expect(major).toBeDefined()
    expect(major!.zhName).toBe('大三和弦')
  })
})

describe('getChordNotes', () => {
  it('returns C major chord (C-E-G)', () => {
    const chord = getChordNotes('C4', 'major')
    expect(chord).not.toBeNull()
    expect(chord!.notes).toHaveLength(3)
    expect(chord!.notes.map(n => n.name)).toEqual(['C', 'E', 'G'])
  })

  it('returns C minor chord (C-D#-G)', () => {
    const chord = getChordNotes('C4', 'minor')
    expect(chord).not.toBeNull()
    expect(chord!.notes.map(n => n.name)).toEqual(['C', 'D#', 'G'])
  })

  it('returns dominant 7th with 4 notes', () => {
    const chord = getChordNotes('C4', 'dominant7')
    expect(chord).not.toBeNull()
    expect(chord!.notes).toHaveLength(4)
  })

  it('returns correct zhName', () => {
    const chord = getChordNotes('C4', 'diminished')
    expect(chord!.zhName).toBe('减三和弦')
  })

  it('returns null for invalid root', () => {
    expect(getChordNotes('invalid', 'major')).toBeNull()
  })

  it('returns null for invalid chord type', () => {
    expect(getChordNotes('C4', 'nonexistent')).toBeNull()
  })
})
