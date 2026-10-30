// Switching conversations without restarting the Lens: "Switch" on the language bar stops the
// corridor conversation, clears the cards and people, and brings back the start card; picking
// "Hospital intake" then starts the hospital conversation from its first line. The language
// setting is kept.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {DEMO_LINES, HOSPITAL_LINES} from "../CaptionDemoScript"
import {controller, ensureDemoRunning, interactable, lineForText, pressHospital, pressStart, waitFor} from "./CaptionTestUtils"

@component
export class SwitchScenarioScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    expect(c.scenario).toBe("corridor")

    // Let the corridor get going, then pick French so we can check it survives the switch.
    const first = c.getCard(1)
    await waitFor("speaker 1 to finish a corridor line", () => first.visible && !first.isSpeaking && first.currentLineText !== "", 15000)
    expect(DEMO_LINES.indexOf(lineForText(first.currentLineText))).toBeGreaterThan(-1)
    await new DefaultLeafInteractor().trigger(interactable("Lang_fr"))
    await sleep(300)
    expect(c.language).toBe("fr")

    await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
    await sleep(300)

    // Back to the start card, with nothing left of the corridor.
    expect(c.isRunning).toBe(false)
    expect(c.startCardVisible).toBe(true)
    expect(findSceneObjectByName("LanguagePicker").enabled).toBe(false)
    for (const s of [1, 2, 3]) {
      const card = c.getCard(s)
      expect(card.visible).toBe(false)
      expect(card.placed).toBe(false)
      expect(card.currentLineText).toBe("")
      expect(card.previousLineText).toBe("")
      expect(card.translationLineText).toBe("")
      expect(c.isFigureTalking(s)).toBe(false)
    }
    // Nothing plays while the start card is up.
    await sleep(1500)
    expect(c.getCard(1).visible).toBe(false)

    await pressHospital()
    await waitFor("demo running", () => c.isRunning, 3000)
    expect(c.scenario).toBe("hospital")
    expect(c.language).toBe("fr")
    expect(c.startCardVisible).toBe(false)
    expect(findSceneObjectByName("LanguagePicker").enabled).toBe(true)

    // Three patient cards, each new again, starting from the hospital's first line.
    for (const s of [1, 2, 3]) {
      const card = c.getCard(s)
      await waitFor("patient " + s + "'s card to appear", () => card.visible, 30000)
      expect(card.badgeVisible).toBe(true)
      await waitFor("patient " + s + " to finish the line", () => !card.isSpeaking, 15000)
      const line = lineForText(card.currentLineText)
      expect(HOSPITAL_LINES.indexOf(line)).toBe(HOSPITAL_LINES.findIndex((l) => l.speaker === s))
      expect(card.previousLineText).toBe("")
      // French was kept: the French speaker needs no translation, the others get French.
      expect(card.translationLineText).toBe(line.spoken === "fr" ? "" : line.fr)
    }
  }
}
