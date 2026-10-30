# Caption build progress (Demo mode)

Hand-over note from the build session on Oct 29, 2026. The build has to continue in a new
Claude Code session in this folder: after Lens Studio restarted, this session's Lens Studio
tools connect to a different Lens Studio window (an empty "Default" project), not CaptionSpecs.

## What's built

All scripts are in `Assets/Scripts/`. Everything is created at runtime by `CaptionController.ts`,
which sits on the `CaptionController` scene object.

| File | What it does |
|---|---|
| `CaptionController.ts` | Runs Demo mode: plays the scripted lines on a timer, sends each to its speaker's card, places a new speaker's card in an arc about 1 m in front and a little below eye level, loops the conversation. Inspector settings: hold seconds (3), words per second (2.8), loop, loop pause, start language. |
| `CaptionDemoScript.ts` | The conversation: 10 lines, speakers 1 (old friend), 2 and 3, with Spanish, French and Japanese translations. Gaps are longer than the 3 s hold so cards visibly hide and come back. |
| `SpeakerCard.ts` | One UI Kit BackPlate card per speaker (26 x 16 cm at 1 m): color and number, live line typed word by word, final line, translation underneath, the previous line below fading away, and a "New speaker detected" label that fades after about 2 s. Pinch and drag to move it (SIK InteractableManipulation, no rotate or scale). Lights up on hover. Hides after the hold time and returns to the same spot. |
| `LanguagePicker.ts` | Panel about 0.6 m away at the bottom of the view: Off / Español / Français / 日本語 buttons, plus a "● DEMO" status label. Shown after Start. |
| `OnboardingCard.ts` | Centered card about 1 m away: what Caption does, the privacy note, Start button. |
| `CaptionUiKit.ts` | Shared text sizes, speaker colors, and text, button and placement helpers. |

Stand-ins: the scene object `STAND-IN Speaker Figures (placeholders)` holds three simple capsule-and-sphere
figures (A = the friend, B, C) about 1.7 to 2 m away. Their meshes and materials are in `Assets/StandIns/`.
Swap them for the rigged models when they arrive.

No AsrModule, ASRMLModule or VoiceML is used anywhere (they turn on Bystander Speech Rejection).

## Checked so far

- TypeScript compiled with no errors and the Lens ran in Preview with no runtime errors.
- The onboarding card rendered correctly in Preview (title, description, privacy note, Start).

## What's left

1. Re-connect: in the new session, confirm the Lens Studio tools report the project
   the project's `CaptionSpecs.esproj`.
2. Recompile. The LEAF test files in `Assets/Scripts/Tests/` were written against the installed
   `Leaf.lspkg` source but have not been compiled yet. Fix any compile errors.
3. Press Start in Preview and watch the full conversation. Check:
   - the cards' arc placement and facing,
   - that 日本語 text renders (the default font may not have Japanese glyphs; if not, find a font that does),
   - the stand-in figure sizes (body 75 x 140 x 45 cm capsule scale, head about 22 cm; heads at about eye height).
4. Attach the tests: create a root scene object `LeafIndex` with a ScriptComponent using
   `Assets/Scripts/Tests/LeafIndex.ts`, compile, then run the scenarios with the LEAF tools.
   The scenarios share one live Lens and must run in index order (onboarding starts the demo):
   - `c5-onboarding-starts-demo`: criterion 5
   - `c1-three-speakers-three-cards`: criterion 1 (needs the start of the conversation, about 30 s)
   - `c3-card-hold-and-return`: criterion 3 (measures the hide time, then waits for the speaker to return)
   - `c2-drag-card-over-figure`: criterion 2 (drags card 1 above figure A, then waits for speaker 1's next line)
   - `c4-language-switch`: criterion 4
   - `reach-language-picker-ik`: checks a full-arm IK reach can press a language button
5. Report which tests pass and which criteria have no test (all five have one).
6. Save the project after each major step and commit at working checkpoints.

## Not committed

- `Packages/` additions (Leaf, Bitmoji 3D, AiPreviewAgentInspect, Icons, Motion) and `Plugins/`.
  Another session or Lens Studio installed these; decide whether they belong in the repo.
  Leaf is needed by the tests.
- `.virtual-scene.json` (a generated scene snapshot; can be deleted or ignored).
