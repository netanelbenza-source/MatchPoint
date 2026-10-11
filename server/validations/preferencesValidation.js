const { z } = require('zod');
const { objectIdSchema } = require('./objectId');
const { GENDERS, SECTORS, EDUCATION_OPTIONS, LIFESTYLE_OPTIONS, LANGUAGE_OPTIONS } = require('./enums');

const ageRangeSchema = z
  .object({
    min: z.number().int().min(18).max(120),
    max: z.number().int().min(18).max(120),
  })
  .refine((range) => range.min <= range.max, {
    message: 'min must be less than or equal to max',
    path: ['min'],
  });

const preferencesCreateSchema = z.object({
  userId: objectIdSchema,
  gender: z.enum(GENDERS),
  sector: z.enum(SECTORS),
  ageRange: ageRangeSchema,
  cities: z.array(z.string().trim().min(1)).default([]),
  languages: z.array(z.enum(LANGUAGE_OPTIONS)).default([]),
  education: z.enum(EDUCATION_OPTIONS),
  lifestyle: z.enum(LIFESTYLE_OPTIONS),
  additionalCriteria: z.record(z.unknown()).default({}),
});

const preferencesUpdateSchema = z
  .object({
    gender: z.enum(GENDERS).optional(),
    sector: z.enum(SECTORS).optional(),
    ageRange: ageRangeSchema.optional(),
    cities: z.array(z.string().trim().min(1)).optional(),
    languages: z.array(z.enum(LANGUAGE_OPTIONS)).optional(),
    education: z.enum(EDUCATION_OPTIONS).optional(),
    lifestyle: z.enum(LIFESTYLE_OPTIONS).optional(),
    additionalCriteria: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

module.exports = {
  ageRangeSchema,
  preferencesCreateSchema,
  preferencesUpdateSchema,
};
