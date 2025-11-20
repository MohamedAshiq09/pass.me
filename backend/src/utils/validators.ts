import Joi from 'joi';

export const schemas = {
  createVault: Joi.object({
    walrus_blob_id: Joi.string().required(),
  }),

  updateVault: Joi.object({
    vault_id: Joi.string().required(),
    walrus_blob_id: Joi.string().required(),
  }),

  createPasswordEntry: Joi.object({
    vault_id: Joi.string().required(),
    domain_hash: Joi.string().length(64).required(), // SHA256 = 64 hex chars
    password_hash: Joi.string().length(64).required(),
    device_id: Joi.string().required(),
  }),

  recordUsage: Joi.object({
    entry_id: Joi.string().required(),
    device_id: Joi.string().required(),
  }),

  getAlerts: Joi.object({
    vault_id: Joi.string().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('login_attempt', 'suspicious_activity', 'password_breach', 'unauthorized_access'),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
  }),

  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/),

  deviceRegistration: Joi.object({
    device_id: Joi.string().required(),
    device_name: Joi.string().required(),
    user_agent: Joi.string().required(),
  }),

  emitAlert: Joi.object({
    vault_id: Joi.string().required(),
    domain_hash: Joi.string().length(64).required(),
    device_id: Joi.string().required(),
    ip_hash: Joi.string().length(64).required(),
    success: Joi.boolean().required(),
  }),
};

export const validate = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw new Error(`Validation error: ${errors.join(', ')}`);
  }
  return value;
};

export default { schemas, validate };