// Live mode's AI on the glasses: Gemini, reached through Snap's Remote Service Gateway (Snap's
// own cloud, no API key in the Lens and nothing on a laptop). One request per bit of speech
// writes down what was said, translates it and updates the conversation summary.

import {AvaliableApiTypes, RemoteServiceGatewayCredentials} from "RemoteServiceGateway.lspkg/RemoteServiceGatewayCredentials"
import {wavBytes} from "./LiveAudio"
import {LiveContext, LiveError, LiveHeard, LiveTranslator, SpeechClip, errorFor} from "./LiveTranslator"

const MODEL = "gemini-2.5-flash"

const INSTRUCTIONS =
  "You caption a live conversation for a deaf or hard-of-hearing person wearing AR glasses. " +
  "You get a few seconds of audio from the glasses' microphone. Write down exactly what was said, " +
  "in the language it was said in, and translate it. Do not guess who is speaking; you cannot tell " +
  "voices apart. If there is no clear speech (noise, music, coughing), set speech to false and leave " +
  "the text fields empty. Never invent words that were not said. " +
  "nameSaid: only a name the speaker clearly says for themselves (\"I'm Daniel\", \"Soy Lucía\"), otherwise \"\". " +
  "summary: one short English sentence summing up the whole conversation so far, building on the " +
  "previous summary; say what was said, not who said it unless a name was given. " +
  "reply: only when the speech is not in English, one short helpful reply or follow-up question " +
  "the wearer could say next, in English (en) and in the speaker's language (native); otherwise null."

const SCHEMA = {
  type: "OBJECT",
  properties: {
    speech: {type: "BOOLEAN"},
    text: {type: "STRING"},
    language: {type: "STRING", description: "ISO 639-1 code of the spoken language"},
    languageName: {type: "STRING", description: "English name of the spoken language"},
    en: {type: "STRING"},
    es: {type: "STRING"},
    fr: {type: "STRING"},
    ja: {type: "STRING"},
    nameSaid: {type: "STRING"},
    summary: {type: "STRING"},
    reply: {
      type: "OBJECT",
      nullable: true,
      properties: {en: {type: "STRING"}, native: {type: "STRING"}},
      required: ["en", "native"]
    }
  },
  required: ["speech", "text", "language", "languageName", "en", "es", "fr", "ja", "nameSaid", "summary"]
}

// The access key ("token") is set by Assets/LocalOnly/LiveAccessKey.ts, a local-only script git
// ignores, so the key is never in the scene file or a commit. The placeholder means it was never set.
export function hasAccessKey(): boolean {
  const key = RemoteServiceGatewayCredentials.getApiToken(AvaliableApiTypes.Google)
  return key !== "" && !key.startsWith("[INSERT")
}

// The gateway's status codes (RemoteApiResponse.statusCode) as the HTTP-style codes errorFor knows.
const GATEWAY_STATUS: Record<number, number> = {3: 400, 4: 401, 5: 404, 6: 504, 7: 413, 8: 500, 11: 429}

export class GeminiTranslator implements LiveTranslator {
  // `service` is RSG's Gemini_Sync remote service module, the same one RSG's Gemini.models uses.
  // Calling it directly keeps the status code, so errors can be told apart in plain words.
  constructor(private service: RemoteServiceModule) {}

  translate(clip: SpeechClip, context: LiveContext): Promise<LiveHeard> {
    if (!hasAccessKey()) return Promise.reject(errorFor(0, "NO_KEY"))
    const audio = Base64.encode(wavBytes(clip))
    const previous = context.summary === "" ? "Nothing has been said yet." : "Summary so far: " + context.summary
    const body = {
      systemInstruction: {parts: [{text: INSTRUCTIONS}]},
      contents: [{role: "user", parts: [{text: previous}, {inlineData: {mimeType: "audio/wav", data: audio}}]}],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: SCHEMA,
        // Captions must keep up with speech: no extra thinking time.
        thinkingConfig: {thinkingBudget: 0}
      }
    }
    const request = RemoteApiRequest.create()
    request.endpoint = "models"
    request.parameters = {
      "api-token": RemoteServiceGatewayCredentials.getApiToken(AvaliableApiTypes.Google),
      model: MODEL,
      type: "generateContent"
    }
    request.body = JSON.stringify(body)
    return new Promise((resolve, reject) => {
      this.service.performApiRequest(request, (response) => {
        if (response.statusCode !== 1) {
          print("[GeminiTranslator] gateway status " + response.statusCode + ": " + response.body.slice(0, 300))
          reject(toLiveError(response.body, GATEWAY_STATUS[response.statusCode] ?? 0))
          return
        }
        try {
          const o = JSON.parse(response.body)
          resolve(parseHeard(o?.candidates?.[0]?.content?.parts?.[0]?.text))
        } catch (e) {
          reject(e instanceof LiveError ? e : errorFor(0, "PARSE"))
        }
      })
    })
  }
}

// The model's JSON answer, checked field by field.
export function parseHeard(raw: string | undefined): LiveHeard {
  let o: any
  try {
    o = JSON.parse(raw ?? "")
  } catch (e) {
    throw errorFor(0, "PARSE")
  }
  const str = (v: any) => (typeof v === "string" ? v.trim() : "")
  const heard: LiveHeard = {
    speech: o?.speech === true && str(o.text) !== "",
    text: str(o?.text),
    language: str(o?.language).toLowerCase() || "en",
    languageName: str(o?.languageName) || "Unknown language",
    en: str(o?.en),
    es: str(o?.es),
    fr: str(o?.fr),
    ja: str(o?.ja),
    nameSaid: str(o?.nameSaid),
    summary: str(o?.summary),
    reply: o?.reply && str(o.reply.en) !== "" ? {en: str(o.reply.en), native: str(o.reply.native)} : null
  }
  return heard
}

// The gateway rejects with the error body; Google's errors carry {error: {code}}.
function toLiveError(body: any, gatewayStatus: number = 0): LiveError {
  if (body instanceof LiveError) return body
  let status = 0
  try {
    const o = typeof body === "string" ? JSON.parse(body) : body
    status = Number(o?.error?.code ?? o?.code ?? o?.statusCode ?? 0) || 0
  } catch (e) {
    const m = /\b(4\d\d|5\d\d)\b/.exec(String(body))
    if (m) status = Number(m[1])
  }
  return errorFor(status || gatewayStatus)
}
