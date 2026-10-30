// Criterion 4: pinching another language changes the translation under the cards,
// including the most recent lines.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {translationOf} from "../CaptionDemoScript"
import {controller, ensureDemoRunning, finishedLine, interactable, pressStart, waitFor} from "./CaptionTestUtils"

@component
export class LanguageSwitchScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    await waitFor("a card with a finished line", () => [1, 2, 3].some((s) => finishedLine(s) !== null), 60000)

    for (const code of ["fr", "es", "ja"] as const) {
      await new DefaultLeafInteractor().trigger(interactable("Lang_" + code))
      await sleep(300)
      expect(c.language).toBe(code)
      let checked = 0
      for (const s of [1, 2, 3]) {
        const line = finishedLine(s)
        if (line === null) continue
        expect(c.getCard(s).translationLineText).toBe(translationOf(line, code))
        checked++
      }
      expect(checked).toBeGreaterThan(0)
    }
  }
}
