// Criterion 14: speaker cards have a "liquid glass" look: a faint, see-through tinted plate with a
// bright rim, so the person behind stays visible, while the words stay bright and readable.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {speakerColor} from "../CaptionUiKit"
import {cardText, controller, ensureDemoRunning, interactable, pressStart, waitFor} from "./CaptionTestUtils"

function seeThrough(c: vec4): boolean {
  return c.w >= 0.15 && c.w <= 0.4
}

@component
export class LiquidGlassCardsScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const card = controller().getCard(1)
    await waitFor("speaker 1 to finish a line", () => card.visible && !card.isSpeaking && card.currentLineText !== "", 60000)

    // The plate: a see-through gradient (20 to 35% opaque) with a rim, slightly cool-tinted.
    const look = card.glassLook
    expect(look.gradient).toBe(true)
    expect(look.rim).toBe(true)
    expect(seeThrough(look.light)).toBe(true)
    expect(seeThrough(look.clear)).toBe(true)
    expect(look.light.z >= look.light.x).toBe(true)

    // The words: fully opaque white with a dark outline; the speaker label keeps its color.
    const words = cardText(1, "CurrentLine")
    expect(words.textFill.color.w).toBe(1)
    expect(words.textFill.color.x).toBe(1)
    expect(words.outlineSettings.enabled).toBe(true)
    expect(cardText(1, "SpeakerLabel").textFill.color.equal(speakerColor(1))).toBe(true)

    // Hover makes the glass a touch brighter, and it settles back afterwards.
    const hovering = new DefaultLeafInteractor().hover(interactable("SpeakerCard_1"), 800)
    await sleep(400)
    const hoverLook = card.glassLook
    await hovering
    expect(hoverLook.hover).toBe(true)
    expect(hoverLook.light.w).toBeGreaterThan(look.light.w)
    expect(seeThrough(hoverLook.light)).toBe(true)
    await sleep(200)
    expect(card.glassLook.hover).toBe(false)
  }
}
