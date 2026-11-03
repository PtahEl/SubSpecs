// Demo voices: every scripted line has its recorded clip. No two voices overlap, and each line
// starts no earlier than its scripted time. While a line's words type out its speaker's voice is
// playing, and the words finish when the clip does. Switch stops the voice.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {ALL_DEMO_LINES} from "../CaptionDemoScript"
import {VOICE_GAP_SECONDS} from "../DemoVoices"
import {controller, ensureDemoRunning, interactable, pressHospital, pressStart, waitFor} from "./CaptionTestUtils"

@component
export class DemoVoicesScenario extends Scenario {
  async run(): Promise<void> {
    const c = controller()
    expect(c.demoVoice.clipCount).toBe(ALL_DEMO_LINES.length)
    for (const line of ALL_DEMO_LINES) expect(c.demoVoice.clipFor(line) !== null).toBe(true)

    // Start the corridor fresh.
    if (c.isRunning || c.isLive) {
      await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
      await sleep(300)
    }
    await ensureDemoRunning(pressStart)
    for (const scenarioCheck of [c.timedLines]) {
      for (let i = 0; i < scenarioCheck.length; i++) {
        const t = scenarioCheck[i]
        expect(t.seconds > 0.5 && t.seconds < 15).toBe(true)
        expect(t.start >= t.line.at).toBe(true)
        if (i > 0) {
          const prev = scenarioCheck[i - 1]
          expect(t.start >= prev.start + prev.seconds + VOICE_GAP_SECONDS - 0.001).toBe(true)
        }
      }
    }

    // Speaker 1's first line: her voice plays while the words type, and they finish with the clip.
    const first = c.timedLines[0]
    const card = c.getCard(first.line.speaker)
    await waitFor("first line typing", () => card.isSpeaking, 5000)
    const began = getTime()
    await sleep(300)
    expect(c.demoVoice.isPlaying(first.line.speaker)).toBe(true)
    await waitFor("first line said", () => !card.isSpeaking, 15000)
    const typed = getTime() - began
    expect(Math.abs(typed - first.seconds) < 0.5).toBe(true)

    // The hospital has its voices too, in Japanese, Spanish and French.
    await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
    await sleep(300)
    await pressHospital()
    const patient = c.getCard(1)
    await waitFor("patient 1 typing", () => patient.isSpeaking, 5000)
    await sleep(300)
    expect(c.demoVoice.isPlaying(1)).toBe(true)

    // Switch stops the voice.
    await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
    await sleep(300)
    expect(c.demoVoice.isPlaying(1)).toBe(false)
  }
}
