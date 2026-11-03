// Live mode's ears: reads the microphone (or, in Lens Studio's Preview, a recorded clip) and cuts
// it into bits of speech at the pauses. It never uses AsrModule or VoiceMLModule: those turn on
// Bystander Speech Rejection, which would hide everyone but the wearer.

import {SpeechClip} from "./LiveTranslator"

export const LIVE_SAMPLE_RATE = 16000

// Where the sound comes from. `read` returns the samples that arrived since the last call.
export interface AudioSource {
  start(): void
  stop(): void
  read(dt: number): Float32Array
}

// The glasses' microphone, through an AudioTrackAsset set to Microphone Audio.
export class MicrophoneSource implements AudioSource {
  private provider: MicrophoneAudioProvider
  private frame: Float32Array

  constructor(track: AudioTrackAsset) {
    this.provider = track.control as MicrophoneAudioProvider
    this.provider.sampleRate = LIVE_SAMPLE_RATE
    this.frame = new Float32Array(this.provider.maxFrameSize)
  }

  start(): void {
    this.provider.start()
  }

  stop(): void {
    this.provider.stop()
  }

  read(_dt: number): Float32Array {
    const shape = this.provider.getAudioFrame(this.frame)
    return this.frame.slice(0, shape.x)
  }
}

// A recorded clip played in real time, for testing in Preview without the glasses.
export class FileSource implements AudioSource {
  private provider: FileAudioTrackProvider
  private running = false
  private owed = 0

  constructor(track: AudioTrackAsset, private loop: boolean = false) {
    this.provider = track.control as FileAudioTrackProvider
    this.provider.sampleRate = LIVE_SAMPLE_RATE
  }

  start(): void {
    this.provider.position = 0
    this.running = true
  }

  stop(): void {
    this.running = false
  }

  get finished(): boolean {
    return !this.running
  }

  read(dt: number): Float32Array {
    if (!this.running) return new Float32Array(0)
    this.owed += dt * LIVE_SAMPLE_RATE
    const want = Math.min(Math.floor(this.owed), this.provider.maxFrameSize)
    if (want <= 0) return new Float32Array(0)
    this.owed -= want
    const buf = new Float32Array(want)
    const shape = this.provider.getAudioBuffer(buf, want)
    if (this.provider.position >= this.provider.duration - 0.01 || shape.x === 0) {
      if (this.loop) this.provider.position = 0
      else this.running = false
    }
    return buf.slice(0, shape.x)
  }
}

// Speech is louder than the room. The threshold follows the room's noise level, so it works in
// a quiet office and a busy corridor alike.
const MIN_SPEECH_RMS = 0.01
const SPEECH_OVER_NOISE = 3
// A pause this long ends a bit of speech; a bit never runs longer than MAX_SECONDS.
const PAUSE_SECONDS = 0.7
const MAX_SECONDS = 10
const MIN_SECONDS = 0.4
// A little sound from before speech started, so the first word isn't clipped.
const LEAD_SECONDS = 0.25
const BLOCK = 320

export class SpeechCutter {
  private noise = 0.005
  private lead: number[] = []
  private clip: number[] = []
  private inSpeech = false
  private quietSeconds = 0
  private speechSeconds = 0
  // Loudness of the bit of speech so far: summed over its loud blocks only.
  private voicedEnergy = 0
  private voicedBlocks = 0
  private pending: number[] = []
  private listeners: ((clip: SpeechClip) => void)[] = []

  onClip(fn: (clip: SpeechClip) => void): void {
    this.listeners.push(fn)
  }

  get hearingSpeech(): boolean {
    return this.inSpeech
  }

  // Feed it whatever samples arrived; it works through them in 20 ms blocks.
  push(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) this.pending.push(samples[i])
    while (this.pending.length >= BLOCK) this.block(this.pending.splice(0, BLOCK))
  }

  // Ends the current bit of speech now (Live mode stopping).
  flush(): void {
    if (this.inSpeech) this.finish()
    this.pending = []
    this.lead = []
  }

  private block(b: number[]): void {
    let sum = 0
    for (const s of b) sum += s * s
    const rms = Math.sqrt(sum / b.length)
    const seconds = b.length / LIVE_SAMPLE_RATE
    const loud = rms > Math.max(MIN_SPEECH_RMS, this.noise * SPEECH_OVER_NOISE)
    if (!this.inSpeech) {
      // Track the room's noise while nobody talks.
      this.noise = this.noise * 0.95 + rms * 0.05
      this.lead = this.lead.concat(b).slice(-Math.floor(LEAD_SECONDS * LIVE_SAMPLE_RATE))
      if (!loud) return
      this.inSpeech = true
      this.clip = this.lead.slice()
      this.speechSeconds = 0
      this.quietSeconds = 0
      this.voicedEnergy = 0
      this.voicedBlocks = 0
    }
    if (loud) {
      this.voicedEnergy += rms * rms
      this.voicedBlocks++
    }
    for (const s of b) this.clip.push(s)
    this.speechSeconds += seconds
    this.quietSeconds = loud ? 0 : this.quietSeconds + seconds
    if (this.quietSeconds >= PAUSE_SECONDS || this.speechSeconds >= MAX_SECONDS) this.finish()
  }

  private finish(): void {
    this.inSpeech = false
    this.lead = []
    const voiced = this.speechSeconds - this.quietSeconds
    const samples = this.clip
    this.clip = []
    if (voiced < MIN_SECONDS) return
    const pcm = new Int16Array(samples.length)
    for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)))
    const level = this.voicedBlocks > 0 ? Math.sqrt(this.voicedEnergy / this.voicedBlocks) : 0
    this.listeners.forEach((fn) => fn({samples: pcm, sampleRate: LIVE_SAMPLE_RATE, level}))
  }
}

// A clip as a WAV file's bytes (16-bit mono PCM), ready to send to the AI.
export function wavBytes(clip: SpeechClip): Uint8Array {
  const dataBytes = clip.samples.length * 2
  const out = new Uint8Array(44 + dataBytes)
  const view = new DataView(out.buffer)
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) out[at + i] = s.charCodeAt(i)
  }
  text(0, "RIFF")
  view.setUint32(4, 36 + dataBytes, true)
  text(8, "WAVE")
  text(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, clip.sampleRate, true)
  view.setUint32(28, clip.sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, "data")
  view.setUint32(40, dataBytes, true)
  for (let i = 0; i < clip.samples.length; i++) view.setInt16(44 + i * 2, clip.samples[i], true)
  return out
}
