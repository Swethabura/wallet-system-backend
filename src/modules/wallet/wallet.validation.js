import Joi from "joi";

const createWalletSchema = Joi.object({
    userId: Joi.number().integer().positive().required(),
});

const amountSchema = Joi.object({
    amount: Joi.number().positive().precision(2).required(),
});

const transferSchema = Joi.object({
//   fromWalletId: Joi.number().integer().positive().required(),
  toWalletId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
});

export default {createWalletSchema, amountSchema, transferSchema};