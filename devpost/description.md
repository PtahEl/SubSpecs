# SubSpecs: Devpost description

**Demo video:** https://youtu.be/Tm1-vk3SC84  
**Code:** https://github.com/PtahEl/SubSpecs

## Tagline
Live subs for the conversation around you on SPECS, with a suggested reply and a running recap, for
people who are deaf or hard of hearing.

## Inspiration
In a loud conference corridor, someone who is hard of hearing spots a friend they haven't seen in
years. Normally they'd nod along and miss most of it, or make everyone shout. Phone captions mean
looking down at one wall of text and losing faces. Glasses can put the words in front of you while
your eyes stay on the people.

## What it does
SubSpecs shows live subs on see-through "liquid glass" cards in front of the wearer.

- **Subs and translation:** everyone's words, in the wearer's view; anyone speaking another language
  is translated automatically, or the wearer picks a language.
- **Help taking part:** after someone answers, SubSpecs suggests the next question in English and in
  their language, so the wearer can read it out or show it.
- **Recap:** one pinch shows what's been said so far.
- **Hospital intake:** at an airport hospital's front desk, patients' answers in Japanese, Spanish and
  French fill an intake form (allergies, medicines, pain, since when, symptoms), with the key facts
  highlighted.
- **Honest by design:** in Live mode SubSpecs can't tell voices apart, so it uses one "Speaking" card
  instead of guessing. It hides the wearer's own speech when it can tell, and its privacy note says
  exactly where audio goes.

Two demo conversations with recorded voices (ElevenLabs), the words typed in time with each voice,
show the whole experience in Lens Studio's preview.

## Who it's for
People who are deaf or hard of hearing, and anyone who works across a language barrier, like a
hospital intake worker.

## How we built it
- Planned with the Devpost Learn skill pack; the design brief and done criteria are in `devpost/`.
- Built by a coding agent through Snap's CLAD plugin and the Lens Studio MCP, in TypeScript with the
  Spectacles Interaction Kit and UI Kit.
- 20 LEAF scenarios test every feature in the preview, including Live mode with a stand-in AI.
- Live mode runs only on the glasses and Snap's cloud: the microphone is read on the glasses, and each
  bit of speech goes to Google's Gemini through Snap's Remote Service Gateway. No server and no laptop.

## Challenges we ran into
- **Snap's speech-to-text only hears the wearer.** It turns on Bystander Speech Rejection, perfect for
  voice commands and wrong for captions. Live mode reads the microphone directly instead.
- **The glasses can't tell who is talking.** We built cards that followed people and cues pointing to
  off-screen speakers, then removed them: they suggested abilities the glasses don't have.
- **No glasses to test on.** Everything runs in the preview; Snap's AI gateway only answers on real
  SPECS, so Live mode is tested with a stand-in AI until then.

## Accomplishments that we're proud of
- Turning subtitles into something you can take part with: reply help, recap and the intake form.
- Telling the truth in the product: one honest card, a privacy note that only claims what's true, and
  plain-words error messages.

## What we learned
- Start from what the hardware can really do; the agent can build almost anything, but deciding what's
  worth building, and what not to fake, is the design work.
- Good AR here means eyes up and hands free: the words come to where you're already looking.

## What's next for SubSpecs
- Testing on real SPECS.
- Streaming subs (words while people talk) and one card per voice, via a streaming speech service with
  speaker labels, with its key kept safe in Snap Cloud.
- Choosing your own language and any translation language.
- Final character models for the demo.

## Built with
Lens Studio, CLAD, Lens Studio MCP, LEAF, TypeScript, Spectacles Interaction Kit, Spectacles UI Kit,
Snap Remote Service Gateway, Google Gemini, ElevenLabs, Mixamo, Blender.
