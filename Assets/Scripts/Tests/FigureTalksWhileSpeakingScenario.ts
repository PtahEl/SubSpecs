// Demo people: each person plays their Talking animation only while their speaker's words
// are appearing, and stands still otherwise.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {controller, ensureDemoRunning, pressStart, waitFor} from "./CaptionTestUtils"

const SPEAKERS = [1, 2, 3]
const TALKING_CLIP = "mixamo.com"

function animationPlaying(speaker: number): boolean {
  const player = controller().speakerFigures[speaker - 1].getComponent("Component.AnimationPlayer") as AnimationPlayer
  return player.getClipIsPlaying(TALKING_CLIP)
}

@component
export class FigureTalksWhileSpeakingScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    expect(c.speakerFigures.length).toBe(3)

    // Watch the conversation until every speaker has talked and stopped at least once,
    // checking each sample that a person talks exactly when their words are appearing.
    const talked = new Set<number>()
    const stopped = new Set<number>()
    let samples = 0
    const start = getTime()
    while (talked.size < 3 || stopped.size < 3) {
      if (getTime() - start > 120) throw new Error("Not every speaker talked and stopped within 120 s")
      for (const s of SPEAKERS) {
        let speaking = c.getCard(s).isSpeaking
        // A quiet person's clip pauses one frame after they stop, so recheck a mismatch once.
        if (animationPlaying(s) !== speaking) {
          await sleep(100)
          speaking = c.getCard(s).isSpeaking
        }
        if (c.isFigureTalking(s) !== speaking || animationPlaying(s) !== speaking) {
          throw new Error("Speaker " + s + (speaking ? " is speaking but the person is still" : " is quiet but the person is talking"))
        }
        if (speaking) talked.add(s)
        else if (talked.has(s)) stopped.add(s)
      }
      samples++
      await sleep(100)
    }
    print("[Caption test] people talked only while speaking over " + samples + " samples")

    // While one speaker talks, the others stand still.
    await waitFor("speaker 3 to talk", () => c.getCard(3).isSpeaking, 90000)
    expect(c.isFigureTalking(3)).toBe(true)
    expect(c.isFigureTalking(1) === c.getCard(1).isSpeaking).toBe(true)
    expect(c.isFigureTalking(2) === c.getCard(2).isSpeaking).toBe(true)
  }
}
