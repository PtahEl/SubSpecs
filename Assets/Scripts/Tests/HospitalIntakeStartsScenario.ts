// Criterion 6: the start card offers "Conference corridor" and "Hospital intake"; pinching
// "Hospital intake" begins the hospital conversation, and each of the three patients gets their
// own card showing their language detected (Japanese, Spanish, French) with the English underneath.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {HOSPITAL_LINES, SpokenLanguage} from "../CaptionDemoScript"
import {controller, lineForText, pressHospital, textOf, waitFor} from "./CaptionTestUtils"

const PATIENTS: [number, SpokenLanguage, string][] = [
  [1, "ja", "Japanese detected"],
  [2, "es", "Spanish detected"],
  [3, "fr", "French detected"]
]

@component
export class HospitalIntakeStartsScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const c = controller()
    expect(findSceneObjectByName("OnboardingCard").enabled).toBe(true)
    expect(c.isRunning).toBe(false)
    expect(textOf("CorridorButtonLabel")).toBe("Conference corridor")
    expect(textOf("HospitalButtonLabel")).toBe("Hospital intake")

    await pressHospital()
    await waitFor("demo running", () => c.isRunning, 3000)
    expect(c.scenario).toBe("hospital")
    expect(c.language).toBe("auto")

    for (const [speaker, spoken, tag] of PATIENTS) {
      const card = c.getCard(speaker)
      await waitFor("patient " + speaker + "'s card to appear", () => card.visible, 30000)
      expect(card.badgeVisible).toBe(true)
      await waitFor("patient " + speaker + "'s new-speaker badge to fade", () => !card.badgeVisible, 4000)
      expect(card.languageTagText).toBe(tag)
      await waitFor("patient " + speaker + " to finish the line", () => !card.isSpeaking, 15000)

      const line = lineForText(card.currentLineText)
      if (!line || HOSPITAL_LINES.indexOf(line) < 0) {
        throw new Error("Card " + speaker + " does not show a hospital line: " + card.currentLineText)
      }
      expect(line.spoken).toBe(spoken)
      expect(card.currentLineText).toBe(line[spoken])
      expect(card.translationLineText).toBe(line.en)
    }
  }
}
