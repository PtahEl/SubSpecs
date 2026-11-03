// Live mode hides the wearer's own speech when it can tell, with a fake AI and made-up sound:
// speech far louder than other people's usual level is not sent at all, and speech that matches a
// reply SubSpecs just suggested (the wearer reading it out) is not shown. Everyone else's speech
// still shows as usual.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {AudioSource, LIVE_SAMPLE_RATE} from "../Live/LiveAudio"
import {FakeTranslator, speechLikeSamples} from "../Live/FakeTranslator"
import {LiveHeard} from "../Live/LiveTranslator"
import {OWN_VOICE_RATIO, OwnVoiceFilter, wordsOf} from "../Live/OwnVoice"
import {controller, interactable, waitFor} from "./CaptionTestUtils"

class TestSound implements AudioSource {
  private queued: number[] = []
  start(): void {}
  stop(): void {}
  say(seconds: number, loudness: number): void {
    const s = speechLikeSamples(seconds, 1.0, LIVE_SAMPLE_RATE, loudness)
    for (let i = 0; i < s.length; i++) this.queued.push(s[i])
  }
  read(dt: number): Float32Array {
    const n = Math.min(this.queued.length, Math.ceil(dt * LIVE_SAMPLE_RATE * 2))
    return new Float32Array(this.queued.splice(0, n))
  }
}

function heard(text: string, reply: {en: string; native: string} | null = null): LiveHeard {
  return {speech: true, text, language: "es", languageName: "Spanish", en: text, es: text, fr: text, ja: text, nameSaid: "", summary: "", reply}
}

const QUIET = 0.1
const WEARER = 0.6

@component
export class LiveOwnVoiceScenario extends Scenario {
  async run(): Promise<void> {
    // The checks on their own.
    const f = new OwnVoiceFilter()
    for (const level of [0.07, 0.08, 0.07]) expect(f.isWearerByLoudness(level)).toBe(false)
    expect(f.isWearerByLoudness(0.07 * OWN_VOICE_RATIO * 1.2)).toBe(true)
    expect(f.isWearerByLoudness(0.09)).toBe(false)
    f.rememberReply(["Does anything hurt her right now?", "¿Le duele algo ahora mismo?"], 0)
    expect(f.isWearerReadingReply("¿le duele algo ahora mismo?", 5)).toBe(true)
    expect(f.isWearerReadingReply("Does anything hurt her right now", 6)).toBe(true)
    expect(f.isWearerReadingReply("My stomach hurts a lot since this morning.", 7)).toBe(false)
    expect(f.isWearerReadingReply("Does anything hurt her right now?", 60)).toBe(false)
    expect(wordsOf("胸が痛いです").length > 1).toBe(true)

    const c = controller()
    const tap = (name: string) => new DefaultLeafInteractor().trigger(interactable(name))
    if (!c.startCardVisible) {
      await tap("SwitchButton")
      await sleep(300)
    }
    const ai = new FakeTranslator(c, 0.3)
    const sound = new TestSound()
    c.useLiveForTests(ai, sound, () => true)
    await tap("LiveButton")
    await sleep(300)
    const card = c.getCard(1)
    const session = c.liveSession

    // Other people, at their usual level: shown. The last one comes with a suggested reply.
    const others = ["Hola, ¿qué tal?", "Busco la sala tres.", "¿Sabe dónde está?"]
    for (let i = 0; i < others.length; i++) {
      ai.answerNext(heard(others[i], i === 2 ? {en: "It's down the hall on the left.", native: "Está al final del pasillo, a la izquierda."} : null))
      sound.say(1.0, QUIET)
      await waitFor("line " + (i + 1) + " shown", () => card.currentLineText === others[i] && !card.isSpeaking, 8000)
    }
    expect(ai.received.length).toBe(3)

    // The wearer, right at the mics: far louder, so it isn't sent at all.
    sound.say(1.0, WEARER)
    await sleep(2500)
    expect(ai.received.length).toBe(3)
    expect(session.ownVoice.hiddenByLoudness).toBe(1)
    expect(card.currentLineText).toBe(others[2])

    // The wearer reading out the suggestion at a normal level: sent, but not shown.
    ai.answerNext(heard("Está al final del pasillo, a la izquierda."))
    sound.say(1.0, QUIET)
    await waitFor("the read-out reply to come back", () => ai.received.length === 4, 8000)
    await sleep(800)
    expect(session.ownVoice.hiddenByReply).toBe(1)
    expect(card.currentLineText).toBe(others[2])

    // Someone else speaks again: shown as usual.
    ai.answerNext(heard("¡Gracias!"))
    sound.say(1.0, QUIET)
    await waitFor("the next line shown", () => card.currentLineText === "¡Gracias!" && !card.isSpeaking, 8000)

    await tap("SwitchButton")
    await sleep(300)
    expect(c.isLive).toBe(false)
  }
}
