// A stand-in for the AI, for the LEAF tests and Preview: speech-to-text and the Remote Service
// Gateway only work on the glasses. Each clip gets the next scripted answer, or a scripted error.

import {LiveContext, LiveError, LiveHeard, LiveTranslator, SpeechClip} from "./LiveTranslator"

export class FakeTranslator implements LiveTranslator {
  private queue: (LiveHeard | LiveError)[] = []
  readonly received: {clip: SpeechClip; context: LiveContext}[] = []

  // `script` owns the timers that make each answer arrive after `delaySeconds`, like a real request.
  constructor(private script: BaseScriptComponent, private delaySeconds: number = 0.3) {}

  answerNext(answer: LiveHeard | LiveError): void {
    this.queue.push(answer)
  }

  translate(clip: SpeechClip, context: LiveContext): Promise<LiveHeard> {
    this.received.push({clip, context})
    const answer = this.queue.shift() ?? silence()
    return new Promise((resolve, reject) => {
      const evt = this.script.createEvent("DelayedCallbackEvent")
      evt.bind(() => {
        if (answer instanceof LiveError) reject(answer)
        else resolve(answer)
      })
      evt.reset(this.delaySeconds)
    })
  }
}

export function silence(): LiveHeard {
  return {speech: false, text: "", language: "en", languageName: "English", en: "", es: "", fr: "", ja: "", nameSaid: "", summary: "", reply: null}
}

// A tone that the speech cutter takes for speech: `seconds` long at `loudness`, then `pauseSeconds` of quiet.
export function speechLikeSamples(seconds: number, pauseSeconds: number, sampleRate: number, loudness: number = 0.2): Float32Array {
  const voiced = Math.floor(seconds * sampleRate)
  const out = new Float32Array(voiced + Math.floor(pauseSeconds * sampleRate))
  for (let i = 0; i < voiced; i++) out[i] = loudness * Math.sin((2 * Math.PI * 220 * i) / sampleRate)
  return out
}
