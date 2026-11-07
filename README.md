# SubSpecs

Live subs for the voices around you on Snap's SPECS AR glasses, for people who are deaf or hard of
hearing, with translation, a suggested reply and a running recap. Built in Lens Studio by a coding
agent through CLAD and the Lens Studio MCP for the
[**Learn AR with SPECS**](https://learn-specs.devpost.com/) Devpost hackathon.

**Demo video (2:55):** https://youtu.be/Tm1-vk3SC84

![SubSpecs in Lens Studio's Preview: the hospital demo, Yuki Tanaka's Japanese words typing as her voice plays, Amélie's French line translated with a suggested reply, and the intake form filling itself in](history/screenshots/2026-11-02-demo-voices.png)

## Who it's for

- **People who are deaf or hard of hearing**, in places where hearing aids and lip-reading fail: a loud
  conference corridor, a group conversation, a hospital front desk.
- **Anyone working across a language barrier**, like an intake worker at a hospital next to an airport.

## What it does

- **Subs that stay with the conversation, not on a phone.** Words appear on see-through "liquid glass"
  cards in front of the wearer, so their eyes stay up on people's faces. Pinch and drag a card to put
  it beside the person talking. The card of whoever is speaking comes slightly forward.
- **Translation.** On Auto, anyone speaking another language is translated into the wearer's; or pick
  a language at the bottom to translate everyone.
- **Help taking part, not just reading.** After a patient answers, SubSpecs suggests the next question
  in English and in their language, so the wearer can read it out or show it.
- **Recap.** One button shows a short summary of the conversation so far.
- **Hospital intake form.** As patients speak, the facts that matter (allergies, medicines, pain,
  since when, symptoms) are highlighted and fill a small form.
- **Honest about its limits.** In Live mode nothing on the glasses can tell voices apart, so SubSpecs
  uses one "Speaking" card instead of pretending to know who is talking. It hides the wearer's own
  speech when it can tell (very loud close speech, or a suggested reply being read out).

## Two modes

**Demo mode** (what the video shows) plays two scripted three-person conversations with recorded
voices (ElevenLabs), in English, Spanish, Japanese and French, with the words typing out in time with
each voice. It needs no internet and no microphone, so anyone can try it in Lens Studio's Preview.

- **Conference corridor:** an old friend, Daniel and Lucía (Spanish) at a conference break.
- **Hospital intake:** Yuki Tanaka (Japanese), Carlos (Spanish) and Amélie (French) at an intake desk.

**Live mode** listens to the glasses' microphone and sends each bit of speech to Google's Gemini
through Snap's Remote Service Gateway, which writes it down, translates it and keeps a running summary.
It runs only on the glasses and Snap's own cloud: no server, no bridge, nothing on a laptop. It avoids
Snap's speech-to-text on purpose, because that turns on Bystander Speech Rejection, which hides everyone
but the wearer. Snap's gateway only answers on real SPECS, so in the Preview Live mode is tested with a
stand-in AI; real transcription is unproven until it runs on glasses.

**Privacy:** subs are shown only to the wearer. The demos use no microphone. In Live mode, what the
microphone hears is sent to Snap's cloud and Google's Gemini AI to be written down and translated.
SubSpecs itself saves no audio or text, names are forgotten when the conversation ends, the camera is
not used, and there is no face recognition.

## Try it

1. Install Git LFS, then clone (models, textures, voices and packages are stored with LFS).
2. Open `CaptionSpecs.esproj` in Lens Studio 5.24 or later. (Internal names still use the project's
   first name, "Caption".)
3. In the Preview panel, pinch **Conference corridor** or **Hospital intake** on the start card.
4. Try the language buttons, **Recap**, and dragging a card. **Switch** goes back to the start card.

Live mode needs an access key for Snap's gateway, kept in a local-only file that is not in this repo
(`Assets/LocalOnly/`), and real SPECS.

## How it was built

- **Planned** with the Devpost Learn skill pack: the plan and done criteria are in
  [`devpost/design-brief.md`](devpost/design-brief.md), updated where the build changed the plan.
- **Built** by a coding agent through Snap's CLAD plugin and the Lens Studio MCP, in TypeScript with
  the Spectacles Interaction Kit and UI Kit (`Assets/Scripts/`).
- **Tested** with 20 LEAF scenarios that run in the Preview (`Assets/Scripts/Tests/`), including Live
  mode with a stand-in AI and test sounds.
- **Every step** is in [`HISTORY.md`](HISTORY.md) with screenshots, and the engineering notes are in
  [`devpost/build-progress.md`](devpost/build-progress.md).

## Credits and pre-existing work

Everything in `Assets/Scripts/` (the SubSpecs Lens: cards, language bar, demo conversations, recap,
intake form, reply help, Live mode and its 20 LEAF tests), the `devpost/` docs and `tools/` were
written for this project during the contest (from Oct 29, 2026). The project started from Lens
Studio's SPECS Base Template. Pre-existing work it uses:

| What | From | Where | Changes |
|---|---|---|---|
| Spectacles Interaction Kit, Spectacles UI Kit, Remote Service Gateway, Utilities, Snap Decorators, Motion, Icons, Bitmoji 3D | Snap (Lens Studio Asset Library) | `Packages/` | None |
| LEAF (test scenarios and simulated hands) and its editor plugin | Snap (Lens Studio Asset Library) | `Assets/Leaf.lspkg`, `Plugins/` | Unpacked; imports pointed at the installed Interaction Kit |
| AI Preview Agent Inspect and Interact | Snap (Lens Studio Asset Library) | `Assets/AiPreviewAgent*.lspkg` | Unpacked; imports pointed at the installed kits |
| Icon Atlas editor plugin | Snap (Lens Studio) | `Plugins/` | None |
| `plan-lens` skill | Devpost Learn skill pack | `agent/skills/plan-lens` | None |
| Echopark HDR lighting | Lens Studio assets | `Assets/Render/Echopark.hdr` | None |
| Three people (Sophie, Brian, Meghan) and their Talking animation | Mixamo (Adobe) | `Assets/People/` | Textures resized to 1024 px; demo stand-ins only |
| Demo voices for the 22 scripted lines | Generated with ElevenLabs | `Assets/Demo/Voices/` | None |

Live mode calls an AI model through Snap's Remote Service Gateway under Snap's terms; no AI service
key is in this repo. The old laptop `caption-server` from the first plan is not part of SubSpecs and
is not in this repo.

## What we learned

- **Design for what the glasses can really do.** Snap's own speech-to-text only hears the wearer, which
  is perfect for voice input and wrong for captions; finding that early shaped Live mode.
- **Don't fake abilities.** Cards that followed people, and cues pointing to off-screen speakers, were
  built and then removed, because the glasses can't actually tell who is talking or where a voice comes
  from. One honest card beats three confident wrong ones.
- **Captions are more useful when they help you act:** a suggested reply, a recap and a filled-in form
  turned subtitles into something you can take part with.

## Status

- Demo mode: complete; 19 of 20 LEAF tests pass on the latest run (a full-arm reach test is flaky in
  long Lens Studio sessions and passes after a restart).
- Live mode: built and tested in the Preview with a stand-in AI; not yet run on real SPECS.
- The three people are Mixamo stand-ins used only for the demo and video; they will be replaced.
