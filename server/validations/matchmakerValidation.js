const { z } = require('zod');

const matchmakerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email().toLowerCase(),
  weeklySuccessCount: z.number().int().min(0).default(0),
  successfulMatches: z.number().int().min(0).default(0),
});

const matchmakerUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

module.exports = {
  matchmakerSchema,
  matchmakerUpdateSchema,
};
