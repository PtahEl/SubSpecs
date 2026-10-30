// LEAF scenarios for Caption's Demo mode — one per done criterion in devpost/design-brief.md.
// They share one live Lens and run in index order: onboarding first (it starts the demo),
// then new speakers (needs the start of the conversation), then the rest.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {translationOf} from "../CaptionDemoScript"
import {controller, distance, ensureDemoRunning, lineForText, waitFor} from "./CaptionTestUtils"

function textOf(name: string): string {
  const so = findSceneObjectByName(name)
  if (!so) throw new Error("Scene object not found: " + name)
  return (so.getComponent("Component.Text") as Text).text
}

function interactable(name: string): Interactable {
  const found = findInteractablesByName(name, undefined, true)[0]
  if (!found) throw new Error("Interactable not found or not enabled: " + name)
  return found
}

async function pressStart(): Promise<void> {
  await new DefaultLeafInteractor().trigger(interactable("StartButton"))
  await sleep(300)
}

// Criterion 5: the onboarding card explains Caption and the privacy note; Start begins the demo.
@component
export class OnboardingStartsDemoScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const card = findSceneObjectByName("OnboardingCard")
    expect(card.enabled).toBe(true)
    expect(controller().isRunning).toBe(false)
    expect(textOf("Description").includes("Live captions for every voice")).toBe(true)
    expect(textOf("PrivacyNote").includes("Audio is never stored")).toBe(true)
    expect(textOf("PrivacyNote").includes("no face recognition")).toBe(true)

    await pressStart()

    expect(card.enabled).toBe(false)
    expect(controller().isRunning).toBe(true)
    expect(findSceneObjectByName("LanguagePicker").enabled).toBe(true)
    expect(controller().status.includes("DEMO")).toBe(true)
  }
}

// Criterion 1: as each of the three voices starts talking, a new color-coded card appears
// with "New speaker detected" — three cards for three voices.
@component
export class ThreeSpeakersThreeCardsScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    const colors: vec4[] = []
    for (const speaker of [1, 2, 3]) {
      const card = c.getCard(speaker)
      await waitFor("card " + speaker + " to appear", () => card.visible, 40000)
      expect(card.badgeVisible).toBe(true)
      expect(contentText(speaker, "NewSpeakerBadge")).toBe("New speaker detected")
      // The badge fades on its own after about 2 s.
      const shownFor = await waitFor("card " + speaker + " badge to fade", () => !card.badgeVisible, 4000)
      expect(shownFor).toBeGreaterThan(1.0)
      colors.push(findSpeakerColor(speaker))
    }
    let visibleCards = 0
    for (const speaker of [1, 2, 3]) if (controller().getCard(speaker).placed) visibleCards++
    expect(visibleCards).toBe(3)
    // Each card has its own color.
    expect(colors[0].equal(colors[1])).toBe(false)
    expect(colors[1].equal(colors[2])).toBe(false)
    expect(colors[0].equal(colors[2])).toBe(false)
  }
}

// Text component `name` inside a speaker card's Content.
function cardText(speaker: number, name: string): Text {
  const content = controller().getCard(speaker).root.getChild(0)
  for (let i = 0; i < content.getChildrenCount(); i++) {
    const child = content.getChild(i)
    if (child.name === name) return child.getComponent("Component.Text") as Text
  }
  throw new Error(name + " not found on card " + speaker)
}

function contentText(speaker: number, name: string): string {
  return cardText(speaker, name).text
}

function findSpeakerColor(speaker: number): vec4 {
  const t = cardText(speaker, "SpeakerLabel")
  expect(t.text).toBe("● Speaker " + speaker)
  return t.textFill.color
}

// Criterion 3: a card hides about 3 s after its speaker stops, and comes back in the same spot.
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

// Criterion 2: dragging a card over a figure keeps it there; the speaker's next words appear
// just above their previous line in that spot while the older line fades.
@component
export class DragCardOverFigureScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const card = controller().getCard(1)
    await waitFor("speaker 1 to be talking", () => card.visible && card.isSpeaking, 90000)

    // Drag the card so it floats just above the friend's head.
    const figure = findSceneObjectByName("StandIn Figure A (friend)")
    const target = figure.getTransform().getWorldPosition().add(new vec3(0, 22, 0))
    const from = card.root.getTransform().getWorldPosition()
    // LEAF applies the drag vector once per drag-update frame, so spread the move over ~60 fps.
    const durationMs = 1500
    const perFrame = target.sub(from).uniformScale(1 / ((durationMs / 1000) * 60))
    await new DefaultLeafInteractor().drag(interactable("SpeakerCard_1"), perFrame, durationMs)
    await sleep(500)
    const placedAt = card.root.getTransform().getWorldPosition()
    print("[Caption test] card moved " + distance(placedAt, from).toFixed(1) + " cm; " +
      distance(placedAt, target).toFixed(1) + " cm from the target")
    expect(distance(placedAt, from)).toBeGreaterThan(20)

    // Wait for the line to finish, then for speaker 1's next line.
    await waitFor("speaker 1 to finish", () => !card.isSpeaking, 15000)
    const earlier = card.currentLineText
    await waitFor("speaker 1 next line", () => card.isSpeaking && card.currentLineText !== earlier, 90000)
    await sleep(300)

    // Same spot, new words on top, the earlier line underneath and fading.
    expect(distance(card.root.getTransform().getWorldPosition(), placedAt) < 1.0).toBe(true)
    expect(card.previousLineText).toBe(earlier)
    // The new line's box sits above the older line's box on the card.
    expect(cardText(1, "CurrentLine").layoutRect.bottom).toBeGreaterThan(cardText(1, "PreviousLine").layoutRect.top)
    const alphaStart = card.previousLineAlpha
    await sleep(1200)
    expect(card.previousLineAlpha < alphaStart).toBe(true)
    await waitFor("older line to fade out", () => card.previousLineText === "", 4000)
  }
}

// Criterion 4: pinching another language changes the translation under the cards,
// including the most recent lines.
@component
export class LanguageSwitchScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    await waitFor("a card with a finished line", () => [1, 2, 3].some((s) => finishedLine(s) !== null), 60000)

    for (const code of ["fr", "ja", "es"] as const) {
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

function finishedLine(speaker: number) {
  const card = controller().getCard(speaker)
  if (card.isSpeaking) return null
  return lineForText(card.currentLineText) ?? null
}

// Reachability: a full-arm IK reach to the language picker must land on the button.
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
