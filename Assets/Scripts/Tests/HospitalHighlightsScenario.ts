// Criterion 7: in the hospital scenario, the intake facts in each English translation
// (allergies, medicines, pain level, how long, symptoms) appear in a highlight color, and
// other words don't. A language picked by hand shows no highlights; Auto brings them back.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {DemoLine, HOSPITAL_LINES, OFF_VIEW_SPEAKER} from "../CaptionDemoScript"
import {controller, ensureDemoRunning, finishedLine, interactable, pressHospital, waitFor} from "./CaptionTestUtils"

// Two lines per patient: through the sixth line of the script.
const LINES_TO_CHECK = 6

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

@component
export class HospitalHighlightsScenario extends Scenario {
  async run(): Promise<void> {
    // The script itself: every line has facts, each an exact phrase of the English, and
    // the facts never cover the whole line.
    // Every patient's line, that is; the nurse (the voice outside the view) isn't a patient.
    for (const line of HOSPITAL_LINES.filter((l) => l.speaker !== OFF_VIEW_SPEAKER)) {
      expect((line.highlights ?? []).length).toBeGreaterThan(0)
      let rest = line.en
      for (const phrase of line.highlights) {
        expect(line.en.includes(phrase)).toBe(true)
        rest = rest.replace(phrase, "")
      }
      expect(rest.replace(/[^A-Za-z]/g, "").length).toBeGreaterThan(0)
    }

    await ensureDemoRunning(pressHospital)
    const c = controller()
    expect(c.scenario).toBe("hospital")

    // Watch the cards; check each line once its English translation shows.
    const checked = new Set<DemoLine>()
    await waitFor(
      LINES_TO_CHECK + " hospital lines with highlighted facts",
      () => {
        for (const speaker of [1, 2, 3]) {
          const line = finishedLine(speaker)
          if (!line || checked.has(line) || HOSPITAL_LINES.indexOf(line) < 0) continue
          const card = c.getCard(speaker)
          if (!card.visible) continue
          expect(card.translationUsesRichText).toBe(true)
          expect(card.translationLineText).toBe(line.en)
          // Exactly the scripted facts are colored, in order; nothing else is.
          const shown = card.translationHighlights
          if (!sameList(shown, line.highlights)) {
            throw new Error("Card " + speaker + " highlights " + JSON.stringify(shown) + ", expected " + JSON.stringify(line.highlights))
          }
          checked.add(line)
        }
        return checked.size >= LINES_TO_CHECK
      },
      60000
    )

    // Highlights are for the English translation only.
    let speaker = 0
    await waitFor(
      "a patient's card showing a finished line",
      () => {
        speaker = [1, 2, 3].find((s) => c.getCard(s).visible && finishedLine(s) !== null) ?? 0
        return speaker > 0
      },
      15000
    )
    const card = c.getCard(speaker)
    await new DefaultLeafInteractor().trigger(interactable("Lang_ja"))
    await sleep(300)
    expect(c.language).toBe("ja")
    expect(card.translationHighlights.length).toBe(0)
    // The speaker may have started a new line meanwhile; check whatever line is finished now.
    const jaLine = finishedLine(speaker)
    if (jaLine) expect(card.translationLineText).toBe(jaLine.spoken === "ja" ? "" : jaLine.ja)

    await new DefaultLeafInteractor().trigger(interactable("Lang_auto"))
    await sleep(300)
    expect(c.language).toBe("auto")
    const autoLine = finishedLine(speaker)
    if (autoLine) expect(sameList(card.translationHighlights, autoLine.highlights)).toBe(true)
  }
}
