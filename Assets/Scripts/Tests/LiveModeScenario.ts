// Live mode, with a fake AI and made-up "speech" sound (the real microphone and Snap's AI service
// only work on the glasses). The start card's Live button starts it: the bar says "● LIVE", each
// bit of speech goes to the AI once, and what comes back shows on the single "Speaking" card, with
// its translation, the name it heard, reply help and the recap. No new-speaker claims, no other
// cards. Without internet nothing is sent and a notice says so; errors show in plain words with a
// code. Switch goes back to Demo mode.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {ScenarioConfig} from "Leaf.lspkg/Scenarios/scenario/ScenarioConfig"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {AudioSource, LIVE_SAMPLE_RATE, wavBytes} from "../Live/LiveAudio"
import {FakeTranslator, speechLikeSamples} from "../Live/FakeTranslator"
import {LiveHeard, errorFor} from "../Live/LiveTranslator"
import {parseHeard} from "../Live/GeminiTranslator"
import {AvaliableApiTypes, RemoteServiceGatewayCredentials} from "RemoteServiceGateway.lspkg/RemoteServiceGatewayCredentials"
import {LIVE_CARD_NAME, LIVE_RECAP_NAME} from "../CaptionController"
import {PRIVACY_NOTE} from "../OnboardingCard"
import {cardText, controller, interactable, textOf, waitFor} from "./CaptionTestUtils"

// Sound the test hands to Live mode, as if the microphone heard it.
class TestSound implements AudioSource {
  private queued: number[] = []
  start(): void {}
  stop(): void {}
  say(seconds: number): void {
    const s = speechLikeSamples(seconds, 1.0, LIVE_SAMPLE_RATE)
    for (let i = 0; i < s.length; i++) this.queued.push(s[i])
  }
  read(dt: number): Float32Array {
    // About real time, so the pause detection sees what the glasses would.
    const n = Math.min(this.queued.length, Math.ceil(dt * LIVE_SAMPLE_RATE * 2))
    return new Float32Array(this.queued.splice(0, n))
  }
}

function heard(o: Partial<LiveHeard>): LiveHeard {
  return Object.assign(
    {speech: true, text: "", language: "en", languageName: "English", en: "", es: "", fr: "", ja: "", nameSaid: "", summary: "", reply: null},
    o
  ) as LiveHeard
}

const LUCIA = heard({
  text: "Hola, soy Lucía. ¿Dónde está la sala del panel?",
  language: "es",
  languageName: "Spanish",
  en: "Hi, I'm Lucía. Where is the panel room?",
  es: "Hola, soy Lucía. ¿Dónde está la sala del panel?",
  fr: "Salut, je suis Lucía. Où est la salle du panel ?",
  ja: "こんにちは、ルシアです。パネルの部屋はどこですか？",
  nameSaid: "Lucía",
  summary: "Lucía asked where the panel room is.",
  reply: {en: "It's down the hall on the left.", native: "Está al final del pasillo, a la izquierda."}
})

const THANKS = heard({
  text: "Thanks, see you there!",
  en: "Thanks, see you there!",
  es: "¡Gracias, nos vemos allí!",
  fr: "Merci, à tout à l'heure !",
  ja: "ありがとう、またあとで！",
  summary: "Lucía asked where the panel room is, then thanked you."
})

@component
export class LiveModeScenario extends Scenario {
  // real=true: Live mode as it really runs, with Gemini through the Remote Service Gateway and the
  // Preview clip as the microphone. Needs the access key and internet; reports what came back.
  private async realRun(c: ReturnType<typeof controller>, tap: (name: string) => Promise<void>): Promise<void> {
    if (!c.startCardVisible) {
      await tap("SwitchButton")
      await sleep(300)
    }
    c.clearLiveForTests()
    // A tiny text-only request first, to tell "Preview can't reach the gateway" from "the audio request is wrong".
    const probe = await new Promise<string>((resolve) => {
      const req = RemoteApiRequest.create()
      req.endpoint = "models"
      req.parameters = {"api-token": RemoteServiceGatewayCredentials.getApiToken(AvaliableApiTypes.Google), model: "gemini-2.5-flash", type: "generateContent"}
      req.body = JSON.stringify({contents: [{role: "user", parts: [{text: "Reply with the single word: ready"}]}]})
      c.geminiService.performApiRequest(req, (r) => resolve(r.statusCode + " " + r.body.slice(0, 200)))
    })
    print("[live-real] text probe: " + probe)
    await tap("LiveButton")
    await sleep(300)
    await tap("Lang_es")
    const card = c.getCard(1)
    await waitFor("an answer from Gemini, or a notice", () => (card.currentLineText !== "" && !card.isSpeaking) || c.liveNotice.visible, 45000)
    print("[live-real] status=" + c.status + " notice=" + c.liveNotice.message)
    print("[live-real] heard=" + card.currentLineText + " | translation=" + card.translationLineText + " | tag=" + card.languageTagText.replace("\n", " / "))
    await waitFor("second bit of speech", () => c.liveSession !== null && c.liveSession.sent >= 2 && !card.isSpeaking, 30000).catch(() => {})
    print("[live-real] heard2=" + card.currentLineText + " | translation=" + card.translationLineText + " | summary=" + (c.liveSession?.conversationSummary ?? ""))
    expect(c.liveNotice.visible).toBe(false)
    expect(card.currentLineText !== "").toBe(true)
    await tap("Lang_auto")
  }

  // With screenshot=true it stops once Lucía's line and the recap are showing, for the history picture.
  async run(config?: ScenarioConfig): Promise<void> {
    const forScreenshot = config?.get("screenshot") === "true"
    const c = controller()
    const tap = (name: string) => new DefaultLeafInteractor().trigger(interactable(name))
    if (config?.get("real") === "true") return this.realRun(c, tap)

    // The AI's answer is checked field by field; a broken answer is a plain-words error.
    expect(parseHeard(JSON.stringify(LUCIA)).languageName).toBe("Spanish")
    let parseCode = ""
    try {
      parseHeard("not json")
    } catch (e) {
      parseCode = e.code
    }
    expect(parseCode).toBe("BAD_ANSWER")
    expect(errorFor(429).notice).toBe("The AI service is busy. Live subs will pause for a moment. (BUSY_429)")
    expect(wavBytes({samples: new Int16Array(100), sampleRate: LIVE_SAMPLE_RATE}).length).toBe(244)

    // The privacy note says what Live mode sends, and doesn't promise what SubSpecs can't.
    expect(PRIVACY_NOTE.includes("Audio is never stored")).toBe(false)
    expect(PRIVACY_NOTE.includes("Gemini")).toBe(true)

    // Back to the start card if an earlier test left a conversation running.
    if (!c.startCardVisible) {
      await tap("SwitchButton")
      await sleep(300)
    }
    expect(textOf("LiveButtonLabel")).toBe("Live")

    const ai = new FakeTranslator(c, 0.3)
    const sound = new TestSound()
    let online = true
    c.useLiveForTests(ai, sound, () => online)
    await tap("LiveButton")
    await sleep(300)
    expect(c.isLive).toBe(true)
    expect(c.startCardVisible).toBe(false)
    expect(findSceneObjectByName("LanguagePicker").enabled).toBe(true)
    expect(c.status).toBe("● LIVE")
    expect(c.liveNotice.visible).toBe(false)

    // Lucía speaks Spanish: one request, and her words on the single "Speaking" card.
    await tap("Lang_auto")
    ai.answerNext(LUCIA)
    sound.say(1.5)
    const card = c.getCard(1)
    await waitFor("the Speaking card to show what was heard", () => card.visible && card.currentLineText === LUCIA.text && !card.isSpeaking, 8000)
    expect(ai.received.length).toBe(1)
    expect(cardText(1, "SpeakerLabel").text).toBe("● " + LIVE_CARD_NAME)
    expect(card.translationLineText).toBe(LUCIA.en)
    expect(card.languageTagText).toBe("Spanish detected\nName said: Lucía")
    expect(card.badgeVisible).toBe(false)
    expect(card.replyText).toBe(LUCIA.reply.en)
    expect(card.replyNativeText).toBe(LUCIA.reply.native)
    // It never claims to know who's talking: the label stays "Speaking", and no other card shows.
    expect(c.getCard(2).visible).toBe(false)
    expect(c.getCard(3).visible).toBe(false)
    if (forScreenshot) {
      c.toggleRecap()
      return
    }

    // The next bit of speech carries the summary so far, and the recap shows the conversation.
    ai.answerNext(THANKS)
    sound.say(1.0)
    await waitFor("the second bit of speech", () => card.currentLineText === THANKS.text && !card.isSpeaking, 8000)
    expect(ai.received[1].context.summary).toBe(LUCIA.summary)
    expect(cardText(1, "SpeakerLabel").text).toBe("● " + LIVE_CARD_NAME)
    expect(card.translationLineText).toBe("")
    c.toggleRecap()
    expect(c.recapPanel.lines).toEqual(["● " + LIVE_RECAP_NAME + ": " + THANKS.summary])
    c.toggleRecap()

    // No internet: the bar says so, a notice explains, and nothing is sent.
    online = false
    await waitFor("offline status", () => c.status === "● OFFLINE", 2000)
    await sleep(200)
    expect(c.liveNotice.message).toBe("No internet. Live subs need Wi-Fi; they come back when you're online. (NO_INTERNET)")
    expect(c.liveNotice.visible).toBe(true)
    sound.say(1.0)
    await sleep(2500)
    expect(ai.received.length).toBe(2)
    online = true
    await waitFor("back online", () => c.status === "● LIVE" && !c.liveNotice.visible, 2000)

    // The service having trouble: a plain-words notice with its code, and Live mode keeps going.
    ai.answerNext(errorFor(503))
    sound.say(1.0)
    await waitFor("trouble notice", () => c.liveNotice.message === "The AI service is having trouble. Trying again. (SERVICE_503)", 8000)
    expect(c.status).toBe("● LIVE")
    ai.answerNext(THANKS)
    sound.say(1.0)
    await waitFor("notice cleared by the next answer", () => !c.liveNotice.visible && ai.received.length === 4, 12000)

    // A key the service won't accept needs fixing: Live mode pauses and says so.
    ai.answerNext(errorFor(401))
    sound.say(1.0)
    await waitFor("paused", () => c.status === "● PAUSED", 8000)
    expect(c.liveNotice.message).toBe("Live mode isn't set up: the AI service didn't accept SubSpecs' access key. (AUTH_401)")

    // Switch: back to the start card and Demo mode, the card a numbered speaker again.
    await tap("SwitchButton")
    await sleep(300)
    expect(c.isLive).toBe(false)
    expect(c.startCardVisible).toBe(true)
    expect(c.liveNotice.visible).toBe(false)
    expect(c.status).toBe("● DEMO")
    expect(cardText(1, "SpeakerLabel").text).toBe("● Speaker 1")
  }
}
