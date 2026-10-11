const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiMatchResponseSchema } = require('../validations/aiValidation');

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
    model: 'gemini-3.8-flash',
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
    candidates: candidates.map((candidate) => ({
      _id: String(candidate._id),
      firstName: candidate.firstName,
      description: candidate.description || '',
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
