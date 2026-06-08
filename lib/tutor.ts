import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, TUTOR_MODEL, Anthropic } from "./anthropic";

export const MIN_XP = 5;
export const MAX_XP = 25;

// Schema the model's reply is constrained to (structured outputs).
export const TutorResponseSchema = z.object({
  reply_roman: z.string(),
  reply_script: z.string(),
  reply_english: z.string(),
  correction: z.string().nullable(),
  new_vocab: z.array(
    z.object({
      roman: z.string(),
      script: z.string(),
      meaning_en: z.string(),
    }),
  ),
  xp_awarded: z.number().int(),
  scenario_complete: z.boolean(),
});

export type TutorResponse = z.infer<typeof TutorResponseSchema>;

export type TutorTurn = { role: "user" | "assistant"; content: string };

export class TutorError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TutorError";
  }
}

export function buildSystemPrompt(level: number, scenario: string): string {
  return `You are Ustaad-jee, a warm, patient Urdu conversation tutor inside a learning
game. The learner's level is ${level} (1=absolute beginner ... 8=fluent small
talk). The current scenario is: "${scenario}".

Rules:
- Speak in NATURAL conversational Urdu appropriate to level ${level}. At low
  levels use very short, simple sentences and common words only. Increase
  complexity gradually with level.
- Stay in character for the scenario. Drive the conversation forward with one
  clear prompt or question per turn.
- If the learner makes a mistake, do NOT break character harshly. Briefly model
  the correct phrasing, then continue.
- Reward effort. Be encouraging.

Return your reply as the structured object with these fields:
- reply_roman: your reply in Roman Urdu (e.g. "Aap kaise hain?")
- reply_script: the same reply in Urdu Nastaliq script
- reply_english: an English translation of your reply
- correction: a gentle correction of the learner's last message, or null if there
  is nothing to correct (or it is the first turn)
- new_vocab: 0-3 useful new words from THIS turn, each with roman, script and
  meaning_en. Use an empty array if none.
- xp_awarded: an integer from ${MIN_XP} to ${MAX_XP} reflecting how well the learner did this
  turn (be generous to beginners)
- scenario_complete: true once the conversation goal is met, otherwise false`;
}

/**
 * Calls Claude with structured outputs so the reply is guaranteed to match the
 * schema. Clamps XP server-side. Throws TutorError on failure.
 */
export async function runTutor(params: {
  level: number;
  scenario: string;
  messages: TutorTurn[];
}): Promise<TutorResponse> {
  const { level, scenario, messages } = params;

  let parsed: TutorResponse | null;
  try {
    const response = await getAnthropic().messages.parse({
      model: TUTOR_MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(level, scenario),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      output_config: { format: zodOutputFormat(TutorResponseSchema) },
    });
    parsed = response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      throw new TutorError("The tutor is busy right now. Try again in a moment.", 429);
    }
    if (err instanceof Anthropic.AuthenticationError) {
      throw new TutorError("Tutor is misconfigured (bad API key).", 503);
    }
    if (err instanceof Anthropic.APIError) {
      throw new TutorError("The tutor had trouble responding. Please try again.", 502);
    }
    throw new TutorError("Unexpected tutor error.", 500);
  }

  if (!parsed) {
    throw new TutorError("The tutor's reply could not be understood. Please try again.", 502);
  }

  // Sanitize: clamp XP into range and round to an int.
  parsed.xp_awarded = Math.max(
    MIN_XP,
    Math.min(MAX_XP, Math.round(parsed.xp_awarded || MIN_XP)),
  );
  // Guard against an oversized vocab list.
  if (parsed.new_vocab.length > 6) parsed.new_vocab = parsed.new_vocab.slice(0, 6);

  return parsed;
}
