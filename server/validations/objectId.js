const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

module.exports = {
  objectIdSchema,
};
