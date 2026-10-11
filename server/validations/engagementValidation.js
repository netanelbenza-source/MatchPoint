const { z } = require('zod');
const { objectIdSchema } = require('./objectId');

const engagementRequestSchema = z
  .object({
    maleId: objectIdSchema,
    femaleId: objectIdSchema,
  })
  .refine((data) => data.maleId !== data.femaleId, {
    message: 'Choose two different people',
  });

const engagementApproveSchema = z.object({
  engagementId: objectIdSchema,
  userId: objectIdSchema,
});

module.exports = {
  engagementRequestSchema,
  engagementApproveSchema,
};
