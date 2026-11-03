// Live mode, start to finish: microphone → bits of speech → AI → a line for the "Speaking" card,
// the recap and reply help. One request at a time; a short backlog waits its turn. It keeps an eye
// on the internet and says in plain words when something is wrong.

import {DemoLine} from "../CaptionDemoScript"
import {AudioSource, SpeechCutter} from "./LiveAudio"
import {LiveError, LiveHeard, LiveTranslator, NO_INTERNET, SpeechClip, errorFor} from "./LiveTranslator"
import {OwnVoiceFilter} from "./OwnVoice"

// Live mode can't tell voices apart, so everything goes on one card.
export const LIVE_SPEAKER = 1
// Clips waiting for the AI; older ones are dropped so subs never fall far behind.
const MAX_WAITING = 3
const RETRY_SECONDS = 3
const BUSY_RETRY_SECONDS = 10
// Written without spaces between words.
const NO_SPACE_LANGUAGES = ["ja", "zh", "th", "lo", "km", "my"]

export type LiveState = "off" | "listening" | "offline" | "stopped"

export class LiveSession {
  private cutter = new SpeechCutter()
  // Best-effort hiding of the wearer's own speech (see OwnVoice.ts).
  readonly ownVoice = new OwnVoiceFilter()
  private clock = 0
  private waiting: SpeechClip[] = []
  private busy = false
  private pauseSeconds = 0
  private summary = ""
  private stateNow: LiveState = "off"
  private noticeNow = ""
  private lineListeners: ((line: DemoLine) => void)[] = []
  private changeListeners: (() => void)[] = []
  // How many requests have gone to the AI, and how many clips were dropped for falling behind.
  sent = 0
  dropped = 0

  constructor(
    private source: AudioSource,
    private translator: LiveTranslator,
    private internetAvailable: () => boolean = () => global.deviceInfoSystem.isInternetAvailable()
  ) {
    this.cutter.onClip((clip) => this.enqueue(clip))
  }

  onLine(fn: (line: DemoLine) => void): void {
    this.lineListeners.push(fn)
  }

  // State or notice changed.
  onChange(fn: () => void): void {
    this.changeListeners.push(fn)
  }

  get state(): LiveState {
    return this.stateNow
  }

  // What's wrong right now, in plain words with its code; "" when all is well.
  get notice(): string {
    return this.noticeNow
  }

  get conversationSummary(): string {
    return this.summary
  }

  get hearingSpeech(): boolean {
    return this.cutter.hearingSpeech
  }

  start(): void {
    this.summary = ""
    this.ownVoice.reset()
    this.clock = 0
    this.waiting = []
    this.pauseSeconds = 0
    try {
      this.source.start()
    } catch (e) {
      this.set("stopped", errorFor(0, "NO_MIC").notice)
      return
    }
    this.set(this.internetAvailable() ? "listening" : "offline", this.internetAvailable() ? "" : NO_INTERNET.notice)
  }

  stop(): void {
    this.source.stop()
    this.cutter.flush()
    this.waiting = []
    this.set("off", "")
  }

  update(dt: number): void {
    if (this.stateNow === "off" || this.stateNow === "stopped") return
    this.clock += dt
    const online = this.internetAvailable()
    if (!online && this.stateNow !== "offline") this.set("offline", NO_INTERNET.notice)
    if (online && this.stateNow === "offline") this.set("listening", "")
    // Keep listening while offline so the room's noise level stays right, but send nothing.
    this.cutter.push(this.source.read(dt))
    if (this.pauseSeconds > 0) this.pauseSeconds -= dt
    if (this.stateNow === "listening" && !this.busy && this.pauseSeconds <= 0 && this.waiting.length > 0) {
      this.send(this.waiting.shift())
    }
  }

  private enqueue(clip: SpeechClip): void {
    if (this.stateNow === "offline") {
      this.dropped++
      return
    }
    // Probably the wearer: far louder than other people. Not sent, so not shown.
    if (this.ownVoice.isWearerByLoudness(clip.level)) return
    this.waiting.push(clip)
    while (this.waiting.length > MAX_WAITING) {
      this.waiting.shift()
      this.dropped++
    }
  }

  private send(clip: SpeechClip): void {
    this.busy = true
    this.sent++
    this.translator.translate(clip, {summary: this.summary}).then(
      (heard) => {
        this.busy = false
        if (this.stateNow === "off") return
        if (this.noticeNow !== "" && this.stateNow === "listening") this.set("listening", "")
        if (!heard.speech) return
        // Probably the wearer reading out a suggested question: not shown.
        if (this.ownVoice.isWearerReadingReply(heard.text, this.clock)) return
        if (heard.summary !== "") this.summary = heard.summary
        if (heard.reply) this.ownVoice.rememberReply([heard.reply.en, heard.reply.native], this.clock)
        const line = lineFromHeard(heard)
        this.lineListeners.forEach((fn) => fn(line))
      },
      (err) => {
        this.busy = false
        if (this.stateNow === "off") return
        const e = err instanceof LiveError ? err : errorFor(0)
        if (!e.retry) {
          this.source.stop()
          this.set("stopped", e.notice)
          return
        }
        this.pauseSeconds = e.code === "BUSY_429" ? BUSY_RETRY_SECONDS : RETRY_SECONDS
        this.set(this.stateNow, e.notice)
      }
    )
  }

  private set(state: LiveState, notice: string): void {
    if (state === this.stateNow && notice === this.noticeNow) return
    this.stateNow = state
    this.noticeNow = notice
    this.changeListeners.forEach((fn) => fn())
  }
}

// The AI's answer as the same kind of line the Demo script plays, so the cards, recap and reply
// help work the same in both modes. It is always speaker 1: the single "Speaking" card.
export function lineFromHeard(h: LiveHeard): DemoLine {
  return {
    speaker: LIVE_SPEAKER,
    at: 0,
    en: h.en || h.text,
    es: h.es || h.text,
    fr: h.fr || h.text,
    ja: h.ja || h.text,
    heard: {
      text: h.text,
      code: h.language,
      languageName: h.languageName,
      noSpaces: NO_SPACE_LANGUAGES.indexOf(h.language) >= 0,
      nameSaid: h.nameSaid || undefined
    },
    recap: h.summary || undefined,
    reply: h.reply ?? undefined
  }
}
