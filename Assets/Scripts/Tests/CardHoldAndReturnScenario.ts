// Criterion 3: a card hides about 3 s after its speaker stops, and comes back in the same spot.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {controller, distance, ensureDemoRunning, pressStart, waitFor} from "./CaptionTestUtils"

@component
export class CardHoldAndReturnScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const card = controller().getCard(2)
    await waitFor("speaker 2 to start a line", () => card.visible && card.isSpeaking, 90000)
    await waitFor("speaker 2 to finish the line", () => !card.isSpeaking, 15000)
    const spot = card.root.getTransform().getWorldPosition()
    const held = await waitFor("card 2 to hide", () => !card.visible, 8000)
    print("[Caption test] card hid " + held.toFixed(2) + " s after the speaker stopped")
    expect(held).toBeGreaterThan(2.5)
    expect(held < 3.6).toBe(true)

    await waitFor("speaker 2 to talk again", () => card.visible, 90000)
    expect(distance(card.root.getTransform().getWorldPosition(), spot) < 1.0).toBe(true)
  }
}
