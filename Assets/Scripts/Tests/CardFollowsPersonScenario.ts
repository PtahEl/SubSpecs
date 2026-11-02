// Criterion 9: a card dropped onto a person is pinned to them: when that person moves, the card
// moves with them and stays above their head. In the demo, Daniel (speaker 2) steps aside
// mid-conversation.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObject, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {STEP_SPEAKER} from "../CaptionController"
import {controller, distance, ensureDemoRunning, interactable, pressStart, waitFor} from "./CaptionTestUtils"

function degrees(rad: number): number {
  return (rad * 180) / Math.PI
}

function headTop(figure: SceneObject): SceneObject {
  const head = findSceneObject((so) => (so.name.endsWith(":Head") ? so : undefined), figure)
  if (!head || head.getChildrenCount() === 0) throw new Error("Head not found on " + figure.name)
  return head.getChild(0)
}

@component
export class CardFollowsPersonScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    const card = c.getCard(STEP_SPEAKER)
    const person = c.speakerFigures[STEP_SPEAKER - 1]
    const top = headTop(person)
    const cam = WorldCameraFinderProvider.getInstance().getTransform()
    const eye = cam.getWorldPosition()
    // Horizontal angle between the card and the person's head, as the wearer sees it.
    const sideways = (): number => {
      const right = cam.right
      const look = cam.forward.uniformScale(-1)
      const a = card.root.getTransform().getWorldPosition().sub(eye)
      const b = top.getTransform().getWorldPosition().sub(eye)
      return degrees(Math.atan2(a.dot(right), a.dot(look)) - Math.atan2(b.dot(right), b.dot(look)))
    }

    await waitFor("Daniel's card to show", () => card.visible && card.isSpeaking, 30000)
    // Drop it just above his head, at the distance the card already has (steered in short drags).
    const aim = top.getTransform().getWorldPosition().add(new vec3(0, 25, 0))
    const from = card.root.getTransform().getWorldPosition()
    const target = eye.add(aim.sub(eye).normalize().uniformScale(distance(from, eye)))
    for (let i = 0; i < 5 && distance(card.root.getTransform().getWorldPosition(), target) > 3; i++) {
      const left = target.sub(card.root.getTransform().getWorldPosition())
      await new DefaultLeafInteractor().drag(interactable("SpeakerCard_" + STEP_SPEAKER), left.uniformScale(1 / 45), 600)
      await sleep(200)
    }
    expect(card.pinnedTo === person).toBe(true)
    const pinnedAt = card.root.getTransform().getWorldPosition()
    const sidewaysBefore = sideways()
    const personBefore = person.getTransform().getWorldPosition()
    const otherBefore = c.getCard(1).root.getTransform().getWorldPosition()

    // While he stands still, the card stays put.
    await sleep(1000)
    expect(distance(card.root.getTransform().getWorldPosition(), pinnedAt) < 1).toBe(true)

    // He steps aside mid-conversation, smoothly; the card goes with him.
    await waitFor("Daniel to start stepping aside", () => c.stepProgress > 0, 40000)
    const midway = await waitFor("Daniel to finish his step", () => c.stepProgress >= 1, 5000)
    expect(midway).toBeGreaterThan(0.8)
    const moved = distance(person.getTransform().getWorldPosition(), personBefore)
    const cardMoved = distance(card.root.getTransform().getWorldPosition(), pinnedAt)
    print("[Caption test] Daniel stepped " + moved.toFixed(1) + " cm; his card moved " + cardMoved.toFixed(1) +
      " cm; card vs head " + sidewaysBefore.toFixed(1) + " -> " + sideways().toFixed(1) + " deg")
    expect(moved).toBeGreaterThan(15)
    expect(cardMoved).toBeGreaterThan(3)
    // Still above his head: the same place relative to him, as the wearer sees it.
    expect(Math.abs(sideways() - sidewaysBefore) < 1.5).toBe(true)
    // A card that wasn't pinned to him didn't move.
    expect(distance(c.getCard(1).root.getTransform().getWorldPosition(), otherBefore) < 1).toBe(true)
  }
}
