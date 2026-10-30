// Shared helpers for Caption's LEAF scenarios.

import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {CaptionController} from "../CaptionController"
import {DEMO_LINES, DemoLine} from "../CaptionDemoScript"

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

export function lineForText(en: string): DemoLine | undefined {
  return DEMO_LINES.find((l) => l.en === en)
}

export function distance(a: vec3, b: vec3): number {
  return a.sub(b).length
}
