const { z } = require('zod');

const ROLES = ['user', 'admin', 'matchmaker'];
const STATUSES = ['active', 'inactive', 'suspended'];

const userCreateSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  passwordHash: z.string().min(1),
  role: z.enum(ROLES).default('user'),
  status: z.enum(STATUSES).default('active'),
});

const userUpdateSchema = z
  .object({
    email: z.string().trim().email().toLowerCase().optional(),
    passwordHash: z.string().min(1).optional(),
    role: z.enum(ROLES).optional(),
    status: z.enum(STATUSES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

function normalizeRole(role) {
  return ROLES.includes(role) ? role : 'user';
}

module.exports = {
  ROLES,
  STATUSES,
  normalizeRole,
  userCreateSchema,
  userUpdateSchema,
};
