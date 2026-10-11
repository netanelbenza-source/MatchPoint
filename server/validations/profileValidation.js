const { z } = require('zod');
const { objectIdSchema } = require('./objectId');
const { GENDERS, SECTORS, EDUCATION_OPTIONS, LIFESTYLE_OPTIONS, LANGUAGE_OPTIONS } = require('./enums');

const profileCreateSchema = z.object({
  userId: objectIdSchema,
  firstName: z.string().trim().min(1),
  age: z.number().int().min(18).max(120),
  city: z.string().trim().min(1),
  gender: z.enum(GENDERS),
  sector: z.enum(SECTORS),
  matchmakerId: objectIdSchema,
  languages: z.array(z.enum(LANGUAGE_OPTIONS)).default([]),
  education: z.enum(EDUCATION_OPTIONS),
  lifestyle: z.enum(LIFESTYLE_OPTIONS),
  description: z.string().trim().default(''),
  isAvailable: z.boolean().default(true),
});

const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    age: z.number().int().min(18).max(120).optional(),
    city: z.string().trim().min(1).optional(),
    gender: z.enum(GENDERS).optional(),
    sector: z.enum(SECTORS).optional(),
    matchmakerId: objectIdSchema.optional(),
    languages: z.array(z.enum(LANGUAGE_OPTIONS)).optional(),
    education: z.enum(EDUCATION_OPTIONS).optional(),
    lifestyle: z.enum(LIFESTYLE_OPTIONS).optional(),
    description: z.string().trim().optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

module.exports = {
  profileCreateSchema,
  profileUpdateSchema,
};
