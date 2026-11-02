// Criterion 11: pinching "Recap" shows a short summary of what each speaker said so far, one line
// per speaker in their color, and pinching it again hides it. The summaries grow as people talk.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {DEMO_LINES, HOSPITAL_LINES} from "../CaptionDemoScript"
import {speakerColor} from "../CaptionUiKit"
import {RECAP_EMPTY} from "../RecapPanel"
import {controller, ensureDemoRunning, interactable, pressStart, waitFor} from "./CaptionTestUtils"

const VIEW_HALF_WIDTH_DEG = 16
const VIEW_HALF_HEIGHT_DEG = 18.5

function degrees(rad: number): number {
  return (rad * 180) / Math.PI
}

// Angles right and up of `p` as the wearer sees it.
function viewAngles(p: vec3): {right: number; up: number} {
  const cam = WorldCameraFinderProvider.getInstance().getTransform()
  const look = cam.forward.uniformScale(-1)
  const to = p.sub(cam.getWorldPosition())
  const right = look.cross(vec3.up()).normalize()
  return {right: degrees(Math.atan2(to.dot(right), to.dot(look))), up: degrees(Math.atan2(to.y, to.dot(look)))}
}

async function pressRecap(): Promise<void> {
  await new DefaultLeafInteractor().trigger(interactable("RecapButton"))
  await sleep(300)
}

@component
export class RecapScenario extends Scenario {
  async run(): Promise<void> {
    // The script: every line carries its speaker's summary so far.
    for (const line of DEMO_LINES.concat(HOSPITAL_LINES)) expect((line.recap ?? "").length).toBeGreaterThan(0)

    await ensureDemoRunning(pressStart)
    const c = controller()
    const recap = c.recapPanel
    expect(recap.visible).toBe(false)

    // The Recap button is inside the view.
    const button = findSceneObjectByName("RecapButton")
    const b = viewAngles(button.getTransform().getWorldPosition())
    expect(Math.abs(b.right) < VIEW_HALF_WIDTH_DEG).toBe(true)
    expect(Math.abs(b.up) < VIEW_HALF_HEIGHT_DEG).toBe(true)

    // Open it before anyone has finished a line: it says so.
    await pressRecap()
    expect(recap.visible).toBe(true)
    const p = viewAngles(recap.root.getTransform().getWorldPosition())
    print("[Caption test] recap panel " + p.right.toFixed(1) + " deg right, " + p.up.toFixed(1) + " deg up")
    expect(Math.abs(p.right) < VIEW_HALF_WIDTH_DEG).toBe(true)
    expect(p.up > 5).toBe(true)
    if (recap.lines.length === 0) {
      const empty = recap.root.getChild(0).getChild(1).getComponent("Component.Text") as Text
      expect(empty.text).toBe(RECAP_EMPTY)
    }

    // Once the old friend has said her first line, she has a line in her color.
    await waitFor("speaker 1 in the recap", () => recap.lines.length >= 1, 15000)
    expect(recap.lines[0].startsWith("● Speaker 1: ")).toBe(true)
    expect(recap.rowColor(0).equal(speakerColor(1))).toBe(true)
    const firstSummary = recap.lines[0]

    // It grows: her summary changes with her second line, and Daniel joins under his name.
    await waitFor("speaker 1's summary to grow", () => recap.lines[0] !== firstSummary, 15000)
    await waitFor("Daniel in the recap", () => recap.lines.length >= 2, 20000)
    expect(recap.lines[1]).toBe("● Daniel: " + DEMO_LINES[2].recap)
    expect(recap.rowColor(1).equal(speakerColor(2))).toBe(true)
    // Sam names herself in her third line; the recap uses her name from then on.
    await waitFor("Sam's name in the recap", () => recap.lines[0].startsWith("● Sam: "), 15000)
    await waitFor("Lucía in the recap", () => recap.lines.length >= 3, 15000)
    expect(recap.lines[2].startsWith("● Lucía: ")).toBe(true)
    expect(recap.rowColor(2).equal(speakerColor(3))).toBe(true)
    // One line per speaker, never more.
    expect(recap.lines.length).toBe(3)

    // Pinching it again hides it.
    await pressRecap()
    expect(recap.visible).toBe(false)
    await pressRecap()
    expect(recap.visible).toBe(true)

    // Switch closes it and starts the next conversation with an empty recap.
    await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
    await sleep(300)
    expect(recap.visible).toBe(false)
    expect(recap.lines.length).toBe(0)

    // A new conversation fills it again from the start (and leaves it open to look at).
    await pressStart()
    await pressRecap()
    expect(recap.visible).toBe(true)
    await waitFor("all three speakers in the new recap", () => recap.lines.length === 3, 45000)
    expect(recap.lines[1]).toBe("● Daniel: " + DEMO_LINES[2].recap)
  }
}
