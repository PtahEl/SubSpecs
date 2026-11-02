// Criterion 10: when someone outside the wearer's view starts talking, a small cue at the edge of
// the view in that speaker's color points toward them, and disappears once they're in view.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {DEMO_LINES, HOSPITAL_LINES, OFF_VIEW_SPEAKER} from "../CaptionDemoScript"
import {placeInFrontOfCamera, speakerColor} from "../CaptionUiKit"
import {CARD_DISTANCE_CM} from "../SpeakerCard"
import {controller, ensureDemoRunning, pressStart, waitFor} from "./CaptionTestUtils"

const VIEW_HALF_WIDTH_DEG = 16

@component
export class WhosTalkingCueScenario extends Scenario {
  async run(): Promise<void> {
    // Both conversations have a voice outside the view.
    expect(DEMO_LINES.some((l) => l.speaker === OFF_VIEW_SPEAKER)).toBe(true)
    expect(HOSPITAL_LINES.some((l) => l.speaker === OFF_VIEW_SPEAKER)).toBe(true)

    await ensureDemoRunning(pressStart)
    const c = controller()
    const cue = c.speakerCue

    // People in view talking: no cue.
    const first = c.getCard(1)
    await waitFor("speaker 1 talking", () => first.isSpeaking, 10000)
    expect(cue.isInView(first)).toBe(true)
    expect(cue.pointsTo).toBe(0)

    // The passer-by off to the right starts talking: an arrow in their color at the right edge.
    const passerBy = c.getCard(OFF_VIEW_SPEAKER)
    await waitFor("the passer-by to start talking", () => passerBy.isSpeaking && passerBy.visible, 60000)
    await waitFor("the cue to point at the passer-by", () => cue.pointsTo === OFF_VIEW_SPEAKER, 1000)
    expect(cue.isInView(passerBy)).toBe(false)
    const where = cue.viewAngles(passerBy.root)
    print("[Caption test] passer-by's card is " + where.right.toFixed(1) + " deg right")
    expect(where.right).toBeGreaterThan(VIEW_HALF_WIDTH_DEG)
    expect(cue.direction).toBe(1)
    expect(cue.color.x).toBe(speakerColor(OFF_VIEW_SPEAKER).x)
    expect(cue.color.y).toBe(speakerColor(OFF_VIEW_SPEAKER).y)
    // The cue itself is inside the view, near its right edge.
    const at = cue.viewAngles(cue.root)
    expect(at.right > 8 && at.right < VIEW_HALF_WIDTH_DEG).toBe(true)

    // Turning toward them brings their card into view (here the card is brought in front of the
    // wearer instead, which is the same as seen from the glasses): the cue goes.
    const cam = WorldCameraFinderProvider.getInstance().getTransform()
    placeInFrontOfCamera(passerBy.root, cam, 0, -12, CARD_DISTANCE_CM)
    await waitFor("the cue to go once the passer-by is in view", () => cue.pointsTo === 0, 1000)
    expect(cue.isInView(passerBy)).toBe(true)
  }
}
