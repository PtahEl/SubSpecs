# Caption build progress (Demo mode)

Hand-over notes from the build sessions on Oct 29, 2026.

## What's built

All scripts are in `Assets/Scripts/`. Everything is created at runtime by `CaptionController.ts`,
which sits on the `CaptionController` scene object.

| File | What it does |
|---|---|
| `CaptionController.ts` | Runs Demo mode: plays the scripted lines on a timer, sends each to its speaker's card, places a new speaker's card in an arc about 1.1 m in front and a little below eye level (10.2 degrees apart, so all three fit the view), loops the conversation. Inspector settings: hold seconds (3), words per second (2.8), loop, loop pause, start language. |
| `CaptionDemoScript.ts` | The conversation: 10 lines, speakers 1 (old friend) and 2 speak English, speaker 3 speaks Spanish, with pre-written English, Spanish, French and Japanese text. `translationFor` decides what goes under each caption for the current setting. Gaps are longer than the 3 s hold so cards visibly hide and come back. |
| `SpeakerCard.ts` | One UI Kit BackPlate card per speaker (19 x 16 cm at 1.1 m): color and number, live line typed word by word, final line, translation underneath, the previous line below fading away, a "Spanish detected" tag when the speaker isn't speaking the wearer's language, and a "New speaker detected" label that fades after about 2 s. Pinch and drag to move it (SIK InteractableManipulation, no rotate, scale or Z stretch, so it moves 1:1 with the hand). Lights up on hover. Hides after the hold time and returns to the same spot. |
| `LanguagePicker.ts` | Panel about 0.6 m away at the bottom of the view (scaled to fit the view): Auto (default) / Off / Español / Français / 日本語 buttons, plus a "● DEMO" status label. Only the buttons are pinch targets; the background panel is not. Shown after Start. |
| `OnboardingCard.ts` | Centered card about 1 m away: what Caption does, the privacy note, Start button. |
| `CaptionUiKit.ts` | Shared text sizes, speaker colors, and text, button and placement helpers. |

Stand-ins: the scene object `STAND-IN Speaker Figures (placeholders)` holds three simple capsule-and-sphere
figures (A = the friend at x -30, B at x 3, C at x 32; 1.7 to 1.95 m away), all inside the view.
Their meshes and materials (`StandInFigure*_PBR.mat`) are in `Assets/StandIns/`. Swap them for the
rigged models when they arrive.

No AsrModule, ASRMLModule or VoiceML is used anywhere (they turn on Bystander Speech Rejection).

## Auto translation

Auto (the default) keeps captions in the wearer's language (English in the demo). When someone
speaks another language, their card shows what they said, a "Spanish detected" tag, and the
English translation underneath. English speakers get no translation line. Picking a language by
hand overrides Auto and translates everyone into that language (no line when the speaker already
speaks it); pinching Auto brings detection back. In Demo mode detection is scripted. In Live mode
the Caption server's Nemotron ASR reports the language of every caption (`lang`), and the server
skips translating captions already in the chosen language (it sends an empty `translation` with
`same_language: true`). For Auto, the Lens sets the target to the wearer's language.

## The Specs view is narrow

Measured in Preview: the Specs display is about 32 degrees wide and 37 degrees tall (about 58 cm
wide at 1 m). Anything placed wider than about 16 degrees off-center is invisible to the wearer.
Keep new UI inside that.

## Done criteria (checked in Lens Studio's Preview, Oct 29 evening)

All seven LEAF scenarios pass when run in index order in Preview (each run resets the Lens and
presses Start itself). Test files are in `Assets/Scripts/Tests/`, one scenario per file, registered
in `LeafIndex.ts` on the `LeafIndex` scene object.

| Criterion | LEAF scenario | Result | Also checked by eye |
|---|---|---|---|
| 1. Three voices, three color-coded cards, "New speaker detected" | `c1-three-speakers-three-cards` | Pass | Cards appear inside the view, each with its own color |
| 2. Drag a card over a figure; next words appear above the previous line in that spot; older line fades | `c2-drag-card-over-figure` | Pass (card moved about 25 cm and sits within 2 degrees of the spot above the friend's head) | Yes |
| 3. Card hides about 3 s after its speaker stops, returns to the same spot | `c3-card-hold-and-return` | Pass (measured 3.00 s) | Yes |
| 4. Picking another language changes the translation, including recent lines | `c4-language-switch` | Pass (French, Spanish, Japanese) | Japanese text renders correctly |
| 5. Onboarding shows what Caption does and the privacy note; Start begins the demo | `c5-onboarding-starts-demo` | Pass | Yes |
| Reach: a full-arm reach can press a language button | `reach-language-picker-ik` | Pass | |
| Extra: Auto detects Spanish and translates it; manual choice overrides; Auto restores | `auto-detect-language` | Pass | Yes |

Every done criterion has a test. Logic proven in Preview; feel unproven until real glasses
(reading while keeping eye contact, the 3-second hold, card size at real distance, real hand tracking).

## Fixed in this session

- LEAF and the AI preview helper packages were made for a newer, renamed Interaction Kit
  (`InteractionKit.lspkg`). They were unpacked into `Assets/Leaf.lspkg`, `Assets/AiPreviewAgentInspect.lspkg`
  and `Assets/AiPreviewAgentInteract.lspkg`, and their imports point at the installed
  `SpectaclesInteractionKit.lspkg` / `SpectaclesUIKit.lspkg`. If LEAF is ever updated from the Asset
  Library, redo that rename (or update SIK to the version LEAF expects).
- Cards 1 and 3, figures A and C, and the language picker were outside the Specs view. All moved in.
- The stand-in figures showed as a magenta checkerboard (their placeholder texture was missing).
  They now use plain colored materials.
- Dragging a card could fling it toward the wearer's face (SIK Z stretch). Turned off for cards.
- The picker's background panel caught pinches meant for its buttons. Turned off.

## What's left

1. Swap the stand-in figures for the rigged models when they arrive (keep them inside the view).
2. Live mode (streaming to the Caption server) is not built.
3. Watch it in Interactive Preview yourself and judge the feel (see "After the build: judge it" in
   the design brief).

## Notes

- `.virtual-scene.json` is a generated scene snapshot and is ignored by git.
- `leaf_plugin_settings.json` is local LEAF panel state and is ignored by git.
