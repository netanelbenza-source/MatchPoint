const { z } = require('zod');
const { objectIdSchema } = require('./objectId');

const criterionResultSchema = z.object({
  criterion: z.string().min(1),
  weight: z.number(),
  passed: z.boolean(),
  userMatchesCandidate: z.boolean(),
  candidateMatchesUser: z.boolean(),
});

const matchRecordSchema = z.object({
  userId: objectIdSchema,
  candidateId: objectIdSchema,
  score: z.number().min(0).max(100),
  criteriaResults: z.array(criterionResultSchema),
});

const matchListSchema = z.array(matchRecordSchema);

module.exports = {
  matchRecordSchema,
  matchListSchema,
};
