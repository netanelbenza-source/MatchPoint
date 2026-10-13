const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1).max(72),
});

const verifyEmailSchema = z.union([
  z.object({
    token: z.string().trim().min(1),
  }),
  z.object({
    email: z.string().trim().email().toLowerCase(),
    code: z.string().trim().regex(/^\d{6}$/),
  }),
]);

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8).max(72),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
