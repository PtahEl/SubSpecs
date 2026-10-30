// Reachability: a full-arm IK reach to the language picker must land on the button.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {controller, ensureDemoRunning, interactable, pressStart} from "./CaptionTestUtils"

@component
export class LanguagePickerReachIKScenario extends Scenario {
  private readonly ik = createIKInteractor()

  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    const before = c.language
    const next = before === "fr" ? "es" : "fr"
    await this.ik.trigger(interactable("Lang_" + next))
    await sleep(500)
    expect(c.language).toBe(next)
  }
}
