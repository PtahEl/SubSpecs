// Best-effort hiding of the wearer's own speech in Live mode. Nothing on the glasses can tell
// voices apart, so these are guesses, and they sometimes miss:
// - Loudness: the wearer's mouth is a few cm from the mics, so their voice arrives much louder
//   than anyone else's. Speech far louder than the usual level of other people is not sent at all.
// - Reply help: when what was heard matches a question or reply SubSpecs just suggested, the
//   wearer is most likely reading it out, so it isn't shown.

// Speech this many times louder than other people's usual level counts as the wearer's (about 11 dB).
export const OWN_VOICE_RATIO = 3.5
// How many recent bits of others' speech set "the usual level", and how many are needed first.
const LEVEL_HISTORY = 12
const LEVELS_NEEDED = 3
// The usual level is the quieter end of what was heard (others are quieter than the wearer).
const USUAL_PERCENTILE = 0.25

// How long a suggestion stays something the wearer might read out, and how close a match must be.
export const REPLY_WINDOW_SECONDS = 30
export const REPLY_MATCH = 0.6

export class OwnVoiceFilter {
  private levels: number[] = []
  private replies: {words: string[]; until: number}[] = []
  // How many bits of speech each check has hidden, for the tests and the notes.
  hiddenByLoudness = 0
  hiddenByReply = 0

  // Before sending: is this bit of speech probably the wearer's? Others' levels are remembered.
  isWearerByLoudness(level: number | undefined): boolean {
    if (level === undefined || level <= 0) return false
    const usual = this.usualLevel()
    if (usual > 0 && level > usual * OWN_VOICE_RATIO) {
      this.hiddenByLoudness++
      return true
    }
    this.levels.push(level)
    if (this.levels.length > LEVEL_HISTORY) this.levels.shift()
    return false
  }

  // A suggestion SubSpecs is showing now, in English and in the speaker's language.
  rememberReply(texts: string[], now: number): void {
    for (const t of texts) {
      const words = wordsOf(t)
      if (words.length > 0) this.replies.push({words, until: now + REPLY_WINDOW_SECONDS})
    }
  }

  // After the AI answers: is this the wearer reading out a suggestion?
  isWearerReadingReply(text: string, now: number): boolean {
    this.replies = this.replies.filter((r) => r.until >= now)
    const words = wordsOf(text)
    if (words.length === 0) return false
    if (this.replies.some((r) => overlap(words, r.words) >= REPLY_MATCH)) {
      this.hiddenByReply++
      return true
    }
    return false
  }

  reset(): void {
    this.levels = []
    this.replies = []
    this.hiddenByLoudness = 0
    this.hiddenByReply = 0
  }

  private usualLevel(): number {
    if (this.levels.length < LEVELS_NEEDED) return 0
    const sorted = this.levels.slice().sort((a, b) => a - b)
    return sorted[Math.floor((sorted.length - 1) * USUAL_PERCENTILE)]
  }
}

// Lowercase words without punctuation. Text written without spaces (Japanese, Chinese) is split
// into pairs of characters instead, so it can be compared the same way.
export function wordsOf(text: string): string[] {
  const clean = text.toLowerCase().replace(/[\p{P}\p{S}]/gu, " ").trim()
  if (clean === "") return []
  if (!/\s/.test(clean) && Array.from(clean).length > 3) {
    const chars = Array.from(clean)
    const pairs: string[] = []
    for (let i = 0; i + 1 < chars.length; i++) pairs.push(chars[i] + chars[i + 1])
    return pairs
  }
  return clean.split(/\s+/)
}

// How much of the heard words appear in the suggestion, and the other way round (the smaller).
function overlap(a: string[], b: string[]): number {
  const inB = new Set(b)
  const inA = new Set(a)
  const shared = a.filter((w) => inB.has(w)).length
  const sharedBack = b.filter((w) => inA.has(w)).length
  return Math.min(shared / a.length, sharedBack / b.length)
}
