// Named speakers: when someone says their name, their card's label changes from "Speaker N" to
// that name, in the same color, for the rest of the conversation. Switch forgets the names.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {DEMO_LINES, HOSPITAL_LINES} from "../CaptionDemoScript"
import {speakerColor} from "../CaptionUiKit"
import {cardText, controller, ensureDemoRunning, interactable, pressStart, waitFor} from "./CaptionTestUtils"

function label(speaker: number): string {
  return cardText(speaker, "SpeakerLabel").text
}

@component
export class NamedSpeakersScenario extends Scenario {
  async run(): Promise<void> {
    // The script: every name is said in its line, in every language the line is written in.
    for (const line of DEMO_LINES.concat(HOSPITAL_LINES)) {
      if (!line.name) continue
      expect(line.en.includes(line.name)).toBe(true)
    }

    await ensureDemoRunning(pressStart)
    const c = controller()

    // Daniel (speaker 2) is "Speaker 2" while he introduces himself, "Daniel" once he's said it.
    const daniel = c.getCard(2)
    await waitFor("speaker 2 talking", () => daniel.visible && daniel.isSpeaking, 30000)
    expect(label(2)).toBe("● Speaker 2")
    await waitFor("speaker 2 to finish", () => !daniel.isSpeaking, 15000)
    expect(label(2)).toBe("● Daniel")
    expect(cardText(2, "SpeakerLabel").textFill.color.equal(speakerColor(2))).toBe(true)

    // The old friend says "I'm Sam" in her third line; Lucía introduces herself in Spanish.
    await waitFor("Sam's name on card 1", () => label(1) === "● Sam", 20000)
    await waitFor("Lucía's name on card 3", () => label(3) === "● Lucía", 20000)
    // Daniel keeps his name for the rest of the conversation.
    expect(label(2)).toBe("● Daniel")

    // Switch ends the conversation: names are forgotten.
    await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
    await sleep(300)
    for (const s of [1, 2, 3]) expect(label(s)).toBe("● Speaker " + s)

    // The hospital: the first patient opens with her name; her intake form uses it too.
    await new DefaultLeafInteractor().trigger(interactable("HospitalButton"))
    const yuki = c.getCard(1)
    await waitFor("patient 1 talking", () => yuki.isSpeaking, 5000)
    await waitFor("patient 1 to finish", () => !yuki.isSpeaking, 15000)
    expect(label(1)).toBe("● Yuki Tanaka")
    await sleep(200)
    expect(cardText(1, "SpeakerLabel").text).toBe("● Yuki Tanaka")
    const title = c.intakeForm.root.getChild(0).getChild(0).getComponent("Component.Text") as Text
    expect(title.text).toBe("Intake · Yuki Tanaka")
  }
}
