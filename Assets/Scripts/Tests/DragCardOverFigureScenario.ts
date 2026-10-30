// Criterion 2: dragging a card over a figure keeps it there; the speaker's next words appear
// just above their previous line in that spot while the older line fades.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObject, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {cardText, controller, distance, ensureDemoRunning, interactable, pressStart, waitFor} from "./CaptionTestUtils"

@component
export class DragCardOverFigureScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const card = controller().getCard(1)
    await waitFor("speaker 1 to be talking", () => card.visible && card.isSpeaking, 90000)

    // Drag the card so, as the wearer sees it, it floats just above the friend's head (the
    // face stays visible), at the distance the card already has.
    const cam = WorldCameraFinderProvider.getInstance().getTransform().getWorldPosition()
    // The friend is Sophie, speaker 1's figure. Her head's middle is halfway between the
    // Mixamo head joint and the top-of-head joint (Mixamo varies the "mixamorig" prefix).
    const friend = controller().speakerFigures[0]
    if (!friend) throw new Error("No figure wired for speaker 1")
    const head = findSceneObject((so) => (so.name.endsWith(":Head") ? so : undefined), friend)
    if (!head || head.getChildrenCount() === 0) throw new Error("Head not found on the friend figure")
    const headPos = head.getTransform().getWorldPosition()
      .add(head.getChild(0).getTransform().getWorldPosition()).uniformScale(0.5)
    const aim = headPos.add(new vec3(0, 30, 0))
    const from = card.root.getTransform().getWorldPosition()
    const target = cam.add(aim.sub(cam).normalize().uniformScale(distance(from, cam)))
    // LEAF moves the drag a fixed step per drag-update frame and the frame rate varies,
    // so steer in a few short drags until the card is on target.
    for (let i = 0; i < 5 && distance(card.root.getTransform().getWorldPosition(), target) > 3; i++) {
      const left = target.sub(card.root.getTransform().getWorldPosition())
      const durationMs = 600
      await new DefaultLeafInteractor().drag(interactable("SpeakerCard_1"), left.uniformScale(1 / 45), durationMs)
      await sleep(200)
    }
    const placedAt = card.root.getTransform().getWorldPosition()
    const offAngle = (Math.acos(placedAt.sub(cam).normalize().dot(aim.sub(cam).normalize())) * 180) / Math.PI
    print("[Caption test] card moved " + distance(placedAt, from).toFixed(1) + " cm; " +
      distance(placedAt, target).toFixed(1) + " cm from the target; " + offAngle.toFixed(1) + " deg from the spot above the head")
    expect(distance(placedAt, from)).toBeGreaterThan(10)
    // Seen from the wearer, the card is centered within 3 degrees of the spot above the head.
    expect(offAngle < 3).toBe(true)

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
