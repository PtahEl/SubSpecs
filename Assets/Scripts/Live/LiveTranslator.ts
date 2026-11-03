// Live mode's AI, behind a small interface: a clip of speech goes in, what was said comes out
// (as heard, translated, and the conversation's running summary). On the glasses this is Gemini
// through Snap's Remote Service Gateway; the LEAF tests use a fake.

// A stretch of speech from the microphone, as 16-bit mono PCM.
export interface SpeechClip {
  samples: Int16Array
  sampleRate: number
}

// What the conversation looked like before this clip, so the AI can keep its summary going.
export interface LiveContext {
  summary: string
}

export interface LiveHeard {
  // False when the clip held no speech (noise, music, a cough): nothing is shown.
  speech: boolean
  // The words as said, in the language spoken.
  text: string
  // Language code (ISO 639-1, like "es") and its English name, like "Spanish".
  language: string
  languageName: string
  // The words in English, Spanish, French and Japanese (the languages the bar offers).
  en: string
  es: string
  fr: string
  ja: string
  // A name the speaker said for themselves ("I'm Daniel"), or "".
  nameSaid: string
  // Running summary of the whole conversation so far, one short sentence, in English.
  summary: string
  // A short reply or question the wearer could say next, in English and in the speaker's
  // language. Only when the speaker isn't speaking the wearer's language.
  reply: {en: string; native: string} | null
}

export interface LiveTranslator {
  translate(clip: SpeechClip, context: LiveContext): Promise<LiveHeard>
}

// Something went wrong, in plain words for the wearer, with the code for support.
export class LiveError {
  constructor(
    readonly code: string,
    readonly message: string,
    // True when trying again later may work (busy, no internet); false when it needs a fix.
    readonly retry: boolean
  ) {}

  get notice(): string {
    return this.message + " (" + this.code + ")"
  }
}

export const NO_INTERNET = new LiveError("NO_INTERNET", "No internet. Live subs need Wi-Fi; they come back when you're online.", true)

// Turns a failure from the AI service into plain words. `status` is the HTTP-style code when known.
export function errorFor(status: number, detail: string = ""): LiveError {
  if (status === 401 || status === 403) {
    return new LiveError("AUTH_" + status, "Live mode isn't set up: the AI service didn't accept SubSpecs' access key.", false)
  }
  if (status === 429) return new LiveError("BUSY_429", "The AI service is busy. Live subs will pause for a moment.", true)
  if (status === 400) return new LiveError("BAD_REQUEST_400", "The AI service couldn't use that bit of speech. It was skipped.", true)
  if (status >= 500) return new LiveError("SERVICE_" + status, "The AI service is having trouble. Trying again.", true)
  if (detail === "PARSE") return new LiveError("BAD_ANSWER", "Couldn't read the AI's answer. One bit of speech was skipped.", true)
  if (detail === "NO_KEY") return new LiveError("NO_KEY", "Live mode isn't set up yet: SubSpecs has no access key for the AI service.", false)
  if (detail === "NO_MIC") return new LiveError("NO_MIC", "Can't hear the microphone. Check that SubSpecs is allowed to use it.", false)
  return new LiveError("UNKNOWN" + (status ? "_" + status : ""), "Something went wrong reaching the AI service. Trying again.", true)
}
