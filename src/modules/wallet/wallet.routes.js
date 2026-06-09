import { Router } from "express";
import walletController from "./wallet.controller.js";
import validate from "../../middlewares/validate.js";
import walletValidation from "./wallet.validation.js";
import idempotency from "../../middlewares/idempotency.js";
import auth from "../../middlewares/auth.js";

const router = Router();

router.post(
  "/create",
  auth,
  walletController.createWallet,
);

router.post(
  "/credit",
  auth,
  validate(walletValidation.amountSchema),
  walletController.creditWallet,
);

router.post(
  "/debit",
  auth,
  validate(walletValidation.amountSchema),
  walletController.debitWallet,
);

router.post(
  "/transfer",
  auth,
  idempotency,
  validate(walletValidation.transferSchema),
  walletController.transferMoney,
);

router.get(
  "/me",
  auth,
  walletController.getMyWallet,
);

router.get(
  "/me/ledger",
  auth,
  walletController.getMyLedger
);

router.post(
  "/deadlock",
  validate(walletValidation.transferSchema),              //for simulation purpose only.
  walletController.simulateDeadlock
);

export default router;
