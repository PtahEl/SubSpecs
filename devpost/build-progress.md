# SubSpecs build progress (Demo and Live mode)

Hand-over notes from the build sessions on Oct 29, 2026.

## What's built

All scripts are in `Assets/Scripts/`. Everything is created at runtime by `CaptionController.ts`,
which sits on the `CaptionController` scene object.

| File | What it does |
|---|---|
| `CaptionController.ts` | Runs Demo mode: plays the conversation picked on the start card (corridor or hospital) on a timer, sends each to its speaker's card, places a new speaker's card in an arc about 1.1 m in front and a little below eye level (10.2 degrees apart, so all three fit the view), loops the conversation. Inspector settings: hold seconds (3), words per second (2.8), loop, loop pause, start language. |
| `CaptionDemoScript.ts` | The two conversations, with pre-written English, Spanish, French and Japanese text. Corridor (`DEMO_LINES`): 10 lines, speakers 1 (old friend) and 2 speak English, speaker 3 speaks Spanish. Hospital intake (`HOSPITAL_LINES`): 12 patient answers, speaker 1 in Japanese, 2 in Spanish, 3 in French; each line's `highlights` lists the intake facts in its English text. `translationFor` decides what goes under each sub for the current setting; `highlightedTranslation` wraps the facts in a color tag; `spokenWords` splits Japanese (no spaces) into 3-character pieces for the typing effect. Gaps are longer than the 3 s hold so cards visibly hide and come back. |
| `SpeakerCard.ts` | One UI Kit BackPlate card per speaker (19 x 16 cm at 1.1 m), drawn as see-through "liquid glass" with a bright rim: color and number, live line typed word by word, final line, translation underneath, the previous line below fading away, a "<language> detected" tag when the speaker isn't speaking the wearer's language, intake facts in lime green (`#C6FF4D`) inside the English translation (the translation Text has rich text on; `<color=#RRGGBB>` tags), and a "New speaker detected" label that fades after about 2 s. Pinch and drag to move it (SIK InteractableManipulation, no rotate, scale or Z stretch, so it moves 1:1 with the hand). Lights up on hover. Hides after the hold time and returns to the same spot. |
| `LanguagePicker.ts` | Panel about 0.6 m away at the bottom of the view (scaled to fit the view): Auto (default) / Off / Español / Français / 日本語 buttons, plus a "● DEMO" status label and a **Switch** button (`SwitchButton`) at the right end. Only the buttons are pinch targets; the background panel is not. Shown once a conversation starts. The bar is 58.6 cm wide before it is scaled down to 32 cm to fit the view. |
| `OnboardingCard.ts` | Centered card about 1 m away: what SubSpecs does, the privacy note, and two buttons side by side, "Conference corridor" (`CorridorButton`) and "Hospital intake" (`HospitalButton`). Comes back when Switch is pinched. |
| `CaptionUiKit.ts` | Shared text sizes, speaker colors, and text, button and placement helpers. |
| `RecapPanel.ts` | The Recap panel: one line per speaker in their color, summing up what they said so far; opened and closed by the Recap button above the language bar. |
| `IntakeForm.ts` | Hospital only: a small form up and to the right (Allergies, Medicines, Pain, Since when, Symptoms) that fills from each patient's answers as they finish, one form per patient, filled fields flash lime. |
| `SpeakerFigures.ts` | Demo only: each person plays their Talking animation while their speaker's words appear, and holds its first frame (a natural standing pose, not the rig's T-pose) otherwise. The clip loops for long lines. |

## Demo people

The scene object `STAND-IN Speaker Figures (placeholders)` holds three Mixamo people (`Assets/People/`),
wired in speaker order into `CaptionController`'s `speakerFigures` input:

| Speaker | Person | Where (as the wearer sees it) |
|---|---|---|
| 1, the old friend | Sophie | left, nearest, about 2.4 m away, 11 degrees left |
| 2 | Brian | center, farthest, about 3.6 m away |
| 3, the Spanish speaker | Meghan | right, about 2.8 m away, 10 degrees right |

They stand at different distances with a gap between each in the view, so they never overlap. All are
real height (176 to 178 cm, eyes at the wearer's eye height) and face the wearer. They only move their
bodies: there is no voice audio and no lip sync, because Demo mode plays scripted text, not sound.
They are committed to the repo on purpose so judges see them, and exist only for Demo mode and the
video: the launched SubSpecs app captions real people from real audio, with no models.
The old capsule figures are still in the scene, disabled (`StandIn Figure A (friend)`, B, C).

Performance: about 144,500 triangles in all (Sophie 53,460, Meghan 48,229, Brian 42,818), 17 skinned
meshes. The FBX files embed 4096 px textures; Lens Studio caps them at 2048 px. Only the color textures
are used (normal maps are off), and those were shrunk to 1024 px into `Assets/People/Textures/` and
used through project-owned materials in `Assets/People/Materials/` (hair and eyelashes cut out their
see-through edges). Editing the FBX's own materials does not stick: Lens Studio keeps those only in its
cache. Mixamo also varies the bone prefix (`mixamorig`, `mixamorig1`, `mixamorig12`), so find bones by
the part after the colon.

No AsrModule, ASRMLModule or VoiceML is used anywhere (they turn on Bystander Speech Rejection).

## Auto translation

Auto (the default) keeps subs in the wearer's language (English in the demo). When someone
speaks another language, their card shows what they said, a "Spanish detected" tag, and the
English translation underneath. English speakers get no translation line. Picking a language by
hand overrides Auto and translates everyone into that language (no line when the speaker already
speaks it); pinching Auto brings detection back. In Demo mode detection is scripted. In Live mode
the SubSpecs server's Nemotron ASR reports the language of every sub (`lang`), and the server
skips translating subs already in the chosen language (it sends an empty `translation` with
`same_language: true`). For Auto, the Lens sets the target to the wearer's language.

## The Specs view is narrow

Measured in Preview: the Specs display is about 32 degrees wide and 37 degrees tall (about 58 cm
wide at 1 m). Anything placed wider than about 16 degrees off-center is invisible to the wearer.
Keep new UI inside that.

## Hospital intake scenario

Picked with "Hospital intake" on the start card. The same three people are patients at an intake desk
next to an international airport; the wearer (the intake worker) hears fine and her questions are not
subbed. Speaker 1, Sophie: Japanese traveler with chest pain. Speaker 2, Brian: Spanish-speaking father
of a six-year-old with a fever. Speaker 3, Meghan: French-speaking woman with a mild peanut reaction.
Auto translates every patient into English with the "<language> detected" tag. Only the English
translation is highlighted: in Live mode the server would mark the facts.

## Switching conversations

Pinching **Switch** on the language bar calls `CaptionController.switchScenario()`: the conversation
stops, every card is reset (`SpeakerCard.reset()`: hidden; text, previous line, translation, tag and
badge cleared; placement forgotten so it reappears in the arc), the people go back to standing still
(`SpeakerFigures.reset()`), the list of who has spoken is cleared so the next speakers are new again,
the language bar hides, and the start card is placed in front of the wearer again
(`OnboardingCard.show()`). The picked conversation then starts from its first line. The language
setting is kept.

## Done criteria (checked in Lens Studio's Preview, Nov 2 with Switch)

All 17 LEAF scenarios pass in Preview (Nov 2, after the depth effect; c14 and named-speakers on a rerun after adjusting them for the softening; `reach-language-picker-ik` failed for a while in the same long session, see its row; the first eleven also passed after restarting Lens
Studio). Each run resets the Lens and presses a start-card button itself: "Conference corridor"
for the original eight, "Hospital intake" for c6 and c7; `switch-scenario` starts the corridor, then
switches to the hospital. Test files are in `Assets/Scripts/Tests/`, one scenario per file, registered
in `LeafIndex.ts` on the `LeafIndex` scene object.

| Criterion | LEAF scenario | Result | Also checked by eye |
|---|---|---|---|
| 1. Three voices, three color-coded cards, "New speaker detected" | `c1-three-speakers-three-cards` | Pass | Cards appear inside the view, each with its own color |
| 2. Drag a card over a figure; next words appear above the previous line in that spot; older line fades | `c2-drag-card-over-figure` | Pass (card moved about 24 cm and sits within 1 degree of the spot above Sophie's head) | Yes |
| 3. Card hides about 3 s after its speaker stops, returns to the same spot | `c3-card-hold-and-return` | Pass (measured 3.00 s) | Yes |
| 4. Picking another language changes the translation, including recent lines | `c4-language-switch` | Pass (French, Spanish, Japanese) | Japanese text renders correctly |
| 5. Onboarding shows what SubSpecs does and the privacy note; "Conference corridor" begins the demo | `c5-onboarding-starts-demo` | Pass | Yes |
| 6. Start card offers both scenarios; "Hospital intake" gives three patients' cards with Japanese, Spanish, French detected and English underneath | `c6-hospital-intake-starts` | Pass | Yes, see `history/screenshots/2026-10-30-hospital-start-card.png` |
| 7. Intake facts in the English translation are highlighted, other words aren't | `c7-hospital-highlights` | Pass (exact highlighted phrases checked on 6 answers; none when Japanese is picked by hand) | Yes, see `history/screenshots/2026-10-30-hospital-intake.png` |
| Reach: a full-arm reach can press a language button | `reach-language-picker-ik` | Pass (Nov 2, after restarting Lens Studio: in index order and twice more on its own). It can fail as the very first test run right after Lens Studio opens ("hoverEnter timed out ... convergence_timeout": the simulated arm doesn't settle), and failed all day Oct 30 in a long-running Lens Studio session; if it fails, run another test first or restart Lens Studio, then rerun. Same on Nov 2 with the intake form: failed twice in a long session, passed right after `c4-language-switch`. Then failed 5 times in a row while adding reply help ("Expected fr, received auto"); a PreviewInteractTool pinch on Lang_fr also had no effect, with nothing in front of the bar. Passed again in the full run after Recap. | |
| Switch: "Switch" stops the corridor, clears cards and people, hides the bar, brings back the start card; "Hospital intake" then starts from its first line, language kept | `switch-scenario` | Pass | Yes, see `history/screenshots/2026-10-30-switch-button.png` |
| Extra: Auto detects Spanish and translates it; manual choice overrides; Auto restores | `auto-detect-language` | Pass | Yes |
| Demo people: a person talks only while their speaker's words appear | `figure-talks-while-speaking` | Pass (about 270 checks over a full round of the conversation) | Yes, see `devpost/screenshots/people-talking-preview.png` |
| 14. Liquid glass cards: faint see-through tinted plate with a bright rim; words bright and readable | `c14-liquid-glass-cards` | Pass (Nov 2) | Yes, see `history/screenshots/2026-11-02-liquid-glass-cards.png` |
| 8. Hospital intake: highlighted facts fill a small intake form (Allergies, Medicines, Pain, Since when, Symptoms) as each is said | `c8-intake-form` | Pass (Nov 2; six answers checked, form inside the view and above every head, hospital only) | Yes, see `history/screenshots/2026-11-02-intake-form.png` |
| 12. Hospital intake: after an answer, a suggested next question in English with the patient's language underneath | `c12-reply-help` | Pass (Nov 2; script checked for all 12 answers, shown text checked on 3) | Yes, see `history/screenshots/2026-11-02-reply-help.png` |
| Named speakers (added Nov 2 at the founder's request): a card shows a speaker's name once they say it; Switch forgets names | `named-speakers` | Pass (Nov 2) | Yes, see `history/screenshots/2026-11-02-named-speakers.png` |
| 11. Pinching "Recap" shows one short line per speaker in their color, summing up what they said so far; pinching again hides it | `c11-recap` | Pass (Nov 2) | Yes, see `history/screenshots/2026-11-02-recap.png` |
| Depth effect (added Nov 2 at the founder's request): the speaking card comes slightly forward at full brightness, quiet cards ease back and soften | `depth-effect` | Pass (Nov 2; 4 cm forward / 3 cm back, label 1.0 / 0.7, no drift as seen by the wearer) | Yes, see `history/screenshots/2026-11-02-depth-effect.png` |

Every done criterion has a test. Logic proven in Preview; feel unproven until real glasses
(reading while keeping eye contact, the 3-second hold, card size at real distance, real hand tracking).

## Differentiating features (Nov 2)

Demo-mode features from the design brief's "Differentiating features" section. Live mode (item 6,
criterion 13) is built separately.

- **Liquid glass cards (criterion 14).** `SpeakerCard.applyGlass` draws the UI Kit BackPlate's
  `RoundedRectangle` as a linear gradient from a light cool sheen (22% opaque, top left) to a faint
  smoky blue (30%, bottom right) with a 0.12 cm bright rim; hover uses slightly brighter stops (30% and
  35%). All card text gets a dark outline and shadow (`addTextOutline` in `CaptionUiKit.ts`;
  `setTextAlpha` fades them with the words). Cards and their text use render order 100/101 so the
  people never draw over the words. `glassLook` reports the plate for the test. The glass code
  (`GLASS`, `applyGlass`, `GLASS_RENDER_ORDER`, `drawAbove`) lives in `CaptionUiKit.ts`; the language bar
  (`LanguagePicker.ts`) uses it too, with outlined words and its buttons drawn over the glass.

- **Intake form (criterion 8).** `IntakeForm.ts`: a small read-only BackPlate (13 x 10 cm at 60 cm,
  its collider and interactable turned off) placed up and to the right (`INTAKE_RIGHT_CM` 9.9,
  `INTAKE_UP_CM` 12.5), above the people. Not beside the language bar as the brief suggested: the bar
  spans the view and the cards sit just above it. Each hospital line in `CaptionDemoScript.ts` has an
  `intake` map (fields from `INTAKE_FIELDS`) written from its highlighted facts. `CaptionController`
  remembers the line each speaker is saying and, once that card stops typing, calls
  `IntakeForm.fill(line)`; the form switches to the speaker when they start talking
  (`showPatient`), keeps one form per patient, flashes filled fields lime for 1.5 s, empties when the
  conversation loops, and is shown only in the hospital (hidden by Switch).

- **Reply help (criterion 12).** Each hospital line has `reply: {en, native}` in
  `CaptionDemoScript.ts`. When a card finishes a line with a reply, `SpeakerCard.showReply` fills
  `ReplyQuestion` ("Ask:" in lime, then the English) and `ReplyNative` (speaker color) in the card's
  bottom strip (from -4.2 cm, sized as if 90 cm away) and clears the fading older line; the hold
  becomes at least `REPLY_SECONDS` (6). Not under the plate as the brief suggested: below card 1 it
  overlapped the logo above the language bar.

- **Named speakers (founder's request).** `DemoLine.name` is the name a speaker says in that line
  (Daniel, Sam, Lucía in the corridor; Yuki Tanaka, Carlos, Amélie in the hospital, each in their
  first answer). When the card finishes the line it calls `SpeakerCard.setName`; `name` is
  "Speaker N" until then and is what the intake form title (`nameOf` callback) shows. `reset()`
  clears it, so Switch forgets names. `setName` is the hook Live mode would call when the server
  reports a name. The privacy note (`PRIVACY_NOTE` in `OnboardingCard.ts`) now says names are
  forgotten when the conversation ends.

- **Recap (criterion 11).** `RecapPanel.ts`: a read-only 13 x 10 cm panel at 60 cm, top left
  (`RECAP_RIGHT_CM` -9.9, `RECAP_UP_CM` 12.5), up to four rows (`RECAP_ROWS`). Every scripted line has
  `recap`: that speaker's summary so far. `CaptionController` now tracks the line each speaker is saying
  in both conversations; once said it calls `RecapPanel.add(line)` (and `IntakeForm.fill` in the
  hospital). Rows are "● name: summary" in the speaker color, in the order people first spoke, with
  names from the cards. The `RecapButton` (`LanguagePicker`, `onRecap`, `setRecapOpen`) sits above the
  bar's right end, mirroring the logo, so the bar's buttons keep their size. Cleared when the
  conversation loops; Switch closes and clears it.

- **Depth effect (founder's request).** `SpeakerCard.updateDepth` eases `depthAmount` toward 1 while
  the card is typing (`isSpeaking`) and 0 otherwise, over `DEPTH_SECONDS` (0.3), smoothstepped. The card
  slides along the line from the wearer through its spot: `DEPTH_FORWARD_CM` (4) nearer when speaking,
  `DEPTH_BACK_CM` (3) farther when quiet; the label and finished words fade to `QUIET_ALPHA` (0.7) when
  quiet. `spot` is the card's place without the shift (tests compare it), `rebase()` is called when a
  card is placed afresh, and the shift is held while dragging so a dropped card stays where it lands.

## Live mode (Nov 2)

Runs only on the glasses and Snap's cloud. Files in `Assets/Scripts/Live/`:

| File | What it does |
|---|---|
| `LiveAudio.ts` | `MicrophoneSource` reads the `Live Microphone` track (`Assets/Live/Live Microphone.micaudio`, 16 kHz); `FileSource` plays a recorded clip in real time for Preview (`CaptionController.previewClip`, editor only). `SpeechCutter` cuts speech at 0.7 s pauses (max 10 s, min 0.4 s voiced) with a threshold that follows the room's noise. `wavBytes` makes a 16-bit WAV. |
| `LiveTranslator.ts` | The AI interface (`translate(clip, {summary}) → LiveHeard`), `LiveError` and `errorFor(status)`: plain words plus a code (`NO_INTERNET`, `AUTH_401/403`, `BUSY_429`, `BAD_REQUEST_400`, `SERVICE_5xx`, `BAD_ANSWER`, `NO_KEY`, `NO_MIC`). |
| `GeminiTranslator.ts` | `gemini-2.5-flash` through RSG `Gemini.models`, audio inline as `audio/wav`, JSON answer with a schema (text, language, en/es/fr/ja, nameSaid, summary, reply), no thinking time. |
| `FakeTranslator.ts` | Scripted answers or errors after a delay, for LEAF. |
| `LiveSession.ts` | Mic → cutter → one request at a time (3 waiting at most, older dropped) → `lineFromHeard` turns the answer into a `DemoLine` for speaker 1, so cards, recap and reply help work as in Demo mode. Watches `deviceInfoSystem.isInternetAvailable()`; retries after 3 s (10 s when busy); stops on errors that need a fix. |
| `LiveNotice.ts` | The notice above the bar. |

- **No AsrModule, no VoiceML.** Both turn on Bystander Speech Rejection (only the wearer is heard). The
  RSG example objects were removed from the scene for that reason (their MicrophoneRecorder loads VoiceML).
- One card, labeled "Speaking" (`SpeakerCard.setAnonymousName`), no new-speaker badge; names said show
  on that line's tag (`DemoLine.heard.nameSaid`); the recap row is "Conversation". The intake form is
  Demo-only, since Live mode can't tell a patient from staff.
- `DemoLine.heard` carries any spoken language (code, name, no-spaces flag) so Live lines aren't limited
  to the four demo languages.
- **Packages:** Remote Service Gateway **2.0.1** (matches SIK/UIKit 2.0; 4.0.0 needs the renamed v4 kits)
  in `Packages/RemoteServiceGateway.lspkg` (the folder must have no spaces), plus Utilities and SnapDecorators.
- **Internet Module** (`Assets/Live/Internet Module.internetModule`) is wired to `CaptionController.internetModule`:
  Snap's Transparent Permission table says Remote API + microphone needs an Internet descriptor to publish.
- **Access key:** `Assets/LocalOnly/LiveAccessKey.ts` (git-ignored) sets the Google RSG token at start
  (scene object "LiveAccessKey (local only)"). Snap's docs say these tokens don't expire but can be
  revoked. Making it needs Lens Studio signed in; on Nov 2 the request got 401 (not signed in), so the key
  is still empty and Live mode shows "isn't set up yet (NO_KEY)" until then. A fresh clone has no such file.
- **Device-only, untested:** the glasses' microphone, the launch permission prompt, Gemini's speed
  and accuracy on real speech, battery and heat, usage limits and cost (Snap doesn't publish them).
- Test: `live-mode` (last in `LeafIndex.ts`; `screenshot=true` stops with Lucía's line showing).

## Demo voices (Nov 2)

- 22 ElevenLabs clips (model `eleven_v4`) in `Assets/Demo/Voices/` (`corridor-01..10.mp3`,
  `hospital-01..12.mp3`, 1.8 MB), wired in order to `CaptionController.demoVoices` (ALL_DEMO_LINES
  order). Voices: Sam = Jessica, Daniel = Chris, Lucía = Catalina, Yuki = Kiyomi, Carlos = Adrián,
  Amélie = Emma.
- `DemoVoices.ts`: one AudioComponent per speaker; `schedule()` gives each line
  `start = max(at, previous start + previous clip length + 0.4 s)` and `seconds` = clip length
  (`FileAudioTrackProvider.duration`); the controller sets the card's words-per-second to
  words / seconds so typing ends with the voice. `restartConversation` stops all voices.
- Test: `demo-voices`, last in `LeafIndex.ts`.

## Live mode in Preview (Nov 2)

- RSG 2.0.1's `setApiToken` only stores the Snap key, so `LiveAccessKey.ts` (local only) creates a
  `RemoteServiceGatewayCredentials` component at runtime on a disabled object, sets `googleToken`,
  then enables it. The key is never in the scene file.
- `GeminiTranslator` calls RSG's `Gemini_Sync` remote service module directly
  (`CaptionController.geminiService`) so the gateway's status code maps to plain words
  (`GATEWAY_STATUS`: 3→400, 4→401, 5→404, 6→504, 7→413, 8→500, 11→429).
- In Lens Studio Preview (device SPECS 27) every request, even text-only, returns status 10 (internal
  error in the remote API framework). Snap: "The APIs are only available on Spectacles." The real
  Gemini path is therefore untested until a Specs run. `live-mode` with `real=true` runs it and prints
  what came back; use it on device.
- **Before publishing:** clear `CaptionController.previewClip` (`Assets/Live/PreviewClip.wav`, a Windows
  text-to-speech test clip) so it isn't shipped.

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

1. ~~Add the SubSpecs logo at start-up and as a small overlay.~~ Done Oct 30: a white copy of the logo
   (`Assets/Branding/SubSpecsLogo_White.png`, unlit material `SubSpecsLogo.mat`, wired to
   `CaptionController`'s `logoMaterial`) replaces the title on the start card and sits small above the
   left end of the language bar. No 3D model version was made.
2. ~~Live mode.~~ Built Nov 2 on Snap's Remote Service Gateway (see "Live mode" above). Still to do: sign Lens Studio in and make the access key, test a real conversation, test on Specs.
3. Watch it in Interactive Preview yourself and judge the feel (see "After the build: judge it" in
   the design brief).

## Notes

- The app is named **SubSpecs** and the feature is called **subs**. Internal names keep the old
  "Caption" wording on purpose (script and class names such as `CaptionController`, the project
  folder `CaptionSpecs`, the `caption-server` folder, its `CAPTION_` settings and its `caption`
  message type) so nothing breaks in Lens Studio or the server.

- `.virtual-scene.json` is a generated scene snapshot and is ignored by git.
- `leaf_plugin_settings.json` is local LEAF panel state and is ignored by git.
