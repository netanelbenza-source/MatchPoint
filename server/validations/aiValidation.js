const { z } = require('zod');

const chatMatchSchema = z.object({
  chatMessage: z.string().trim().min(1).max(4000),
});

const aiMatchSchema = z.object({
  id: z.string().min(1),
  firstName: z.string(),
  matchPercentage: z.string().min(1),
  explanation: z.string().min(1),
});

const aiMatchResponseSchema = z.object({
  matches: z.array(aiMatchSchema).max(3),
});

module.exports = {
  chatMatchSchema,
  aiMatchResponseSchema,
};
