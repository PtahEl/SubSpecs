// Criterion 12: in the hospital scenario, after a patient answers, a suggested next question
// appears for the wearer on that patient's card under the answer, in English with the patient's language
// underneath, for a few seconds.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {DEMO_LINES, DemoLine, HOSPITAL_LINES} from "../CaptionDemoScript"
import {REPLY_SECONDS} from "../SpeakerCard"
import {cardText, controller, ensureDemoRunning, finishedLine, pressHospital, waitFor} from "./CaptionTestUtils"

// One answer per patient: Japanese, Spanish, French.
const ANSWERS_TO_CHECK = 3

@component
export class ReplyHelpScenario extends Scenario {
  async run(): Promise<void> {
    // The script: every hospital answer has a question in English and in the patient's language;
    // the corridor has none.
    for (const line of HOSPITAL_LINES) {
      expect(line.reply !== undefined).toBe(true)
      expect(line.reply.en.length).toBeGreaterThan(0)
      expect(line.reply.native.length).toBeGreaterThan(0)
      expect(line.reply.native === line.reply.en).toBe(false)
    }
    for (const line of DEMO_LINES) expect(line.reply === undefined).toBe(true)

    await ensureDemoRunning(pressHospital)
    const c = controller()

    // While a patient talks there's no suggestion; once their answer is said, it appears.
    const card1 = c.getCard(1)
    await waitFor("patient 1 talking", () => card1.isSpeaking, 10000)
    expect(card1.replyText).toBe("")

    const checked = new Set<DemoLine>()
    let lastChecked = 0
    await waitFor(
      ANSWERS_TO_CHECK + " answers with a suggested question",
      () => {
        for (const speaker of [1, 2, 3]) {
          const line = finishedLine(speaker)
          if (!line || checked.has(line) || HOSPITAL_LINES.indexOf(line) < 0) continue
          const card = c.getCard(speaker)
          expect(card.visible).toBe(true)
          expect(card.replyText).toBe(line.reply.en)
          expect(card.replyNativeText).toBe(line.reply.native)
          // Under the answer: below its translation, inside the card, and the older line is gone.
          expect(cardText(speaker, "ReplyQuestion").layoutRect.top <= cardText(speaker, "TranslationLine").layoutRect.bottom).toBe(true)
          expect(card.previousLineText).toBe("")
          checked.add(line)
          lastChecked = speaker
        }
        return checked.size >= ANSWERS_TO_CHECK
      },
      40000
    )

    // It stays up a few seconds, then goes with the card.
    const card = c.getCard(lastChecked)
    const shownFor = await waitFor("the suggestion to go", () => !card.visible || card.replyText === "", REPLY_SECONDS * 1000 + 3000)
    print("[Caption test] suggestion for patient " + lastChecked + " shown about " + shownFor.toFixed(1) + " s more")
    expect(shownFor).toBeGreaterThan(REPLY_SECONDS - 1.5)
  }
}
