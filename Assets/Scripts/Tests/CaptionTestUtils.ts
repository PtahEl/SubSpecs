// Shared helpers for Caption's LEAF scenarios.

import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {CaptionController} from "../CaptionController"
import {DEMO_LINES, DemoLine, spokenText} from "../CaptionDemoScript"

export function controller(): CaptionController {
  const so = findSceneObjectByName("CaptionController")
  if (!so) throw new Error("CaptionController scene object not found")
  return so.getComponent(CaptionController.getTypeName()) as CaptionController
}

// Polls `cond` every frame-ish until true; throws with `what` on timeout.
export async function waitFor(what: string, cond: () => boolean, timeoutMs: number): Promise<number> {
  const start = getTime()
  while (!cond()) {
    if ((getTime() - start) * 1000 > timeoutMs) {
      throw new Error("Timed out after " + timeoutMs + " ms waiting for: " + what)
    }
    await sleep(50)
  }
  return getTime() - start
}

// Starts the demo through the Start button if no earlier scenario did.
export async function ensureDemoRunning(start: () => Promise<void>): Promise<void> {
  if (!controller().isRunning) await start()
  await waitFor("demo running", () => controller().isRunning, 3000)
}

// The demo line whose words (as spoken) are `text`.
export function lineForText(text: string): DemoLine | undefined {
  return DEMO_LINES.find((l) => spokenText(l) === text)
}

export function distance(a: vec3, b: vec3): number {
  return a.sub(b).length
}

export function textOf(name: string): string {
  const so = findSceneObjectByName(name)
  if (!so) throw new Error("Scene object not found: " + name)
  return (so.getComponent("Component.Text") as Text).text
}

export function interactable(name: string): Interactable {
  const found = findInteractablesByName(name, undefined, true)[0]
  if (!found) throw new Error("Interactable not found or not enabled: " + name)
  return found
}

export async function pressStart(): Promise<void> {
  await new DefaultLeafInteractor().trigger(interactable("StartButton"))
  await sleep(300)
}

// Text component `name` inside a speaker card's Content.
export function cardText(speaker: number, name: string): Text {
  const content = controller().getCard(speaker).root.getChild(0)
  for (let i = 0; i < content.getChildrenCount(); i++) {
    const child = content.getChild(i)
    if (child.name === name) return child.getComponent("Component.Text") as Text
  }
  throw new Error(name + " not found on card " + speaker)
}

// The demo line a card last finished, or null while that speaker is still talking.
export function finishedLine(speaker: number): DemoLine | null {
  const card = controller().getCard(speaker)
  if (card.isSpeaking) return null
  return lineForText(card.currentLineText) ?? null
}
