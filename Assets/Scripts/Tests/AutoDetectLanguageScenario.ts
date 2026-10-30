// Auto translation: a speaker talking another language is detected and translated into the
// wearer's language without picking anything; English speakers get no translation line.
// Picking a language by hand still overrides it, and Auto brings it back.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {LanguageCode} from "../CaptionDemoScript"
import {controller, ensureDemoRunning, finishedLine, interactable, lineForText, pressStart, waitFor} from "./CaptionTestUtils"

@component
export class AutoDetectLanguageScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    expect(c.language).toBe("auto")

    // Speaker 3 speaks Spanish.
    const card = c.getCard(3)
    await waitFor("speaker 3 to start talking", () => card.visible && card.isSpeaking, 40000)
    await waitFor("the new-speaker badge to fade", () => !card.badgeVisible, 4000)
    expect(card.languageTagText).toBe("Spanish detected")
    await waitFor("speaker 3 to finish the line", () => !card.isSpeaking, 15000)
    const line = lineForText(card.currentLineText)
    if (!line) throw new Error("Card 3 does not show a demo line: " + card.currentLineText)
    expect(line.spoken).toBe("es")
    expect(card.currentLineText).toBe(line.es)
    expect(card.translationLineText).toBe(line.en)

    // English speakers need no translation on Auto.
    for (const s of [1, 2]) {
      if (finishedLine(s) !== null) expect(c.getCard(s).translationLineText).toBe("")
    }

    // A language picked by hand overrides Auto; Auto brings the English back.
    const expectations: [LanguageCode, string][] = [
      ["fr", line.fr],
      ["es", ""],
      ["auto", line.en]
    ]
    for (const [code, expected] of expectations) {
      await new DefaultLeafInteractor().trigger(interactable("Lang_" + code))
      await sleep(300)
      expect(c.language).toBe(code)
      expect(card.translationLineText).toBe(expected)
    }
  }
}
