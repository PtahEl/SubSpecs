// Depth effect: the card of whoever is speaking comes a little toward the wearer at full
// brightness, while a quiet card eases back a little and softens. Neither moves as seen by the
// wearer.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {DEPTH_BACK_CM, DEPTH_FORWARD_CM, QUIET_ALPHA, SpeakerCard} from "../SpeakerCard"
import {controller, ensureDemoRunning, pressStart, waitFor} from "./CaptionTestUtils"

function fromWearer(p: vec3): number {
  return p.sub(WorldCameraFinderProvider.getInstance().getTransform().getWorldPosition()).length
}

// Degrees between where the card is drawn and its spot, as the wearer sees them.
function driftDeg(card: SpeakerCard): number {
  const eye = WorldCameraFinderProvider.getInstance().getTransform().getWorldPosition()
  const a = card.root.getTransform().getWorldPosition().sub(eye).normalize()
  const b = card.spot.sub(eye).normalize()
  return (Math.acos(Math.min(1, a.dot(b))) * 180) / Math.PI
}

@component
export class DepthEffectScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    const sam = c.getCard(1)
    const daniel = c.getCard(2)

    // Sam talks while Daniel's card is still up from his line: one active, one quiet.
    await waitFor(
      "Sam talking while Daniel's card is still showing",
      () => sam.isSpeaking && sam.visible && daniel.visible && !daniel.isSpeaking,
      40000
    )
    // The change eases in over about 0.3 s.
    await sleep(450)
    expect(sam.isSpeaking && daniel.visible).toBe(true)

    const active = sam.depth
    const quiet = daniel.depth
    print("[Caption test] speaking card " + active.offset.toFixed(1) + " cm, label " + active.labelAlpha.toFixed(2) +
      "; quiet card " + quiet.offset.toFixed(1) + " cm, label " + quiet.labelAlpha.toFixed(2) + ", words " + quiet.wordsAlpha.toFixed(2))
    // Nearer: the speaking card sits in front of its spot, the quiet one behind its spot.
    expect(fromWearer(sam.root.getTransform().getWorldPosition()) < fromWearer(sam.spot) - DEPTH_FORWARD_CM + 0.5).toBe(true)
    expect(fromWearer(daniel.root.getTransform().getWorldPosition()) > fromWearer(daniel.spot) + DEPTH_BACK_CM - 0.5).toBe(true)
    // Brighter: full brightness when speaking; softened, but still readable, when quiet.
    expect(active.labelAlpha > 0.95).toBe(true)
    expect(quiet.labelAlpha < 0.75).toBe(true)
    expect(quiet.labelAlpha >= QUIET_ALPHA - 0.01).toBe(true)
    expect(quiet.wordsAlpha >= QUIET_ALPHA - 0.01).toBe(true)
    // Neither card moved as the wearer sees it.
    expect(driftDeg(sam) < 0.1).toBe(true)
    expect(driftDeg(daniel) < 0.1).toBe(true)

    // When Daniel talks again his card comes forward and brightens.
    await waitFor("Daniel talking again", () => daniel.isSpeaking && daniel.visible, 30000)
    // (The preview's frame times can lag the clock a little, so allow the ease to be nearly done.)
    await sleep(600)
    expect(daniel.depth.offset < -DEPTH_FORWARD_CM + 0.5).toBe(true)
    expect(daniel.depth.labelAlpha > 0.95).toBe(true)
  }
}
