import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    PORT: Joi.number().empty('').default(3000),

    DATABASE_URL: Joi.string().uri().required(),

    JWT_ACCESS_SECRET: Joi.string().required(),

    JWT_ACCESS_EXPIRES_IN: Joi.alternatives()
        .try(Joi.number(), Joi.string().regex(/^(\d+([smhdwy]|ms))$/))
        .default('15m'),

    JWT_REFRESH_SECRET: Joi.string().required(),

    JWT_REFRESH_EXPIRES_IN: Joi.alternatives()
        .try(Joi.number(), Joi.string().regex(/^(\d+([smhdwy]|ms))$/))
        .default('7d'),

    SALT_ROUNDS: Joi.number().default(12),
});
