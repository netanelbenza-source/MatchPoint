const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiMatchResponseSchema } = require('../validations/aiValidation');

const SHORTLIST_SIZE = 12;

function words(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1);
}

// The model only returns three names, so reading every profile makes the request slow.
function shortlist(chatMessage, candidates) {
  const wanted = new Set(words(chatMessage));
  const ranked = candidates.map((candidate) => {
    const haystack = words(`${candidate.firstName || ''} ${candidate.description || ''}`);
    const score = haystack.reduce((total, word) => total + (wanted.has(word) ? 1 : 0), 0);
    return { candidate, score };
  });
  ranked.sort((left, right) => right.score - left.score);
  const matching = ranked.filter((item) => item.score > 0).slice(0, SHORTLIST_SIZE);
  const chosen = matching.length > 0 ? matching : ranked.slice(0, SHORTLIST_SIZE);
  return chosen.map((item) => item.candidate);
}

function parseModelJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('The assistant returned an invalid response');
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function rankCandidatesByChat(chatMessage, candidates) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not set');
    error.statusCode = 500;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
    systemInstruction: [
      'You are an expert matchmaker.',
      'Read the user chat request and the candidate descriptions.',
      'Choose at most 3 candidates whose descriptions best fit the request.',
      'Return only JSON with this shape:',
      '{"matches":[{"id":"candidate _id","firstName":"name","matchPercentage":"85%","explanation":"why the description fits"}]}',
      'matchPercentage must be a text percentage.',
      'Use only ids from the candidate list. Do not invent candidates.',
      'Write the explanation in the same language as the user chat.',
      'If none of the descriptions fit, return {"matches":[]}.',
    ].join(' '),
  });

  const prompt = JSON.stringify({
    chatMessage,
    candidates: shortlist(chatMessage, candidates).map((candidate) => ({
      _id: String(candidate._id),
      firstName: candidate.firstName,
      description: String(candidate.description || '').slice(0, 180),
    })),
  });

  let parsed;
  try {
    const result = await model.generateContent(prompt);
    parsed = parseModelJson(result.response.text());
  } catch (error) {
    if (error && error.statusCode) throw error;
    const failure = new Error('העוזר לא הצליח לענות. נסה שוב בעוד רגע.');
    failure.statusCode = 502;
    throw failure;
  }

  const validated = aiMatchResponseSchema.safeParse(parsed);
  if (!validated.success) {
    const error = new Error('The assistant returned an invalid response');
    error.statusCode = 502;
    throw error;
  }
  return validated.data;
}

module.exports = {
  rankCandidatesByChat,
};
