// Criterion 14: speaker cards have a "liquid glass" look: a faint, see-through tinted plate with a
// bright rim, so the person behind stays visible, while the words stay bright and readable.
// The language bar at the bottom has the same glass.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {GLASS_RENDER_ORDER, speakerColor} from "../CaptionUiKit"
import {QUIET_ALPHA} from "../SpeakerCard"
import {cardText, controller, ensureDemoRunning, interactable, pressStart, textOf, waitFor} from "./CaptionTestUtils"

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

    // The words: white with a dark outline, never dimmer than a quiet card's softened words (the
    // depth effect); the speaker label keeps its color.
    const words = cardText(1, "CurrentLine")
    expect(words.textFill.color.w >= QUIET_ALPHA - 0.01).toBe(true)
    expect(words.textFill.color.x).toBe(1)
    expect(words.outlineSettings.enabled).toBe(true)
    const label = cardText(1, "SpeakerLabel").textFill.color
    const color = speakerColor(1)
    expect(label.x === color.x && label.y === color.y && label.z === color.z).toBe(true)

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

    // The language bar is glass too: gradient and rim on, drawn after the scene; its words are
    // outlined, and the selected language is still marked in green.
    const bar = findSceneObjectByName("LanguagePicker")
    const barPlate = bar.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    expect(barPlate.gradient).toBe(true)
    expect(barPlate.border).toBe(true)
    expect(barPlate.renderOrder >= GLASS_RENDER_ORDER).toBe(true)
    const status = textOf("StatusIndicator")
    expect(status).toBe("● DEMO")
    for (const name of ["Lang_autoLabel", "SwitchButtonLabel", "StatusIndicator"]) {
      const t = findSceneObjectByName(name).getComponent("Component.Text") as Text
      expect(t.outlineSettings.enabled).toBe(true)
      expect(t.textFill.color.w).toBe(1)
    }
    expect(textOf("Lang_autoLabel")).toBe("✓ Auto")
  }
}
