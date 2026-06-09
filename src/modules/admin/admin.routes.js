import { Router } from "express";
import adminController from "./admin.controller.js";
import auth from "../../middlewares/auth.js";
import authorize from "../../middlewares/authorize.js";

const router = Router();

router.use(auth, authorize("admin"));

router.get(
  "/users",
  adminController.getAllUsers
);

router.patch(
  "/users/:id/freeze",
  adminController.freezeUser
);

router.patch(
  "/users/:id/activate",
  adminController.activateUser
);

router.get(
  "/users/stats",
  adminController.getUserStats
);

router.get(
  "/wallets/stats",
  adminController.getWalletStats
);

router.get(
  "/wallets",
  adminController.getAllWallets
);

router.patch(
  "/wallets/:id/freeze",
  adminController.freezeWallet
);

router.patch(
  "/wallets/:id/activate",
  adminController.activateWallet
);

router.get(
  "/transactions",
  adminController.getLedger
);

router.get(
  "/wallets/:walletId/reconstruct-balance",
  adminController.getReconstructedWalletBalance
);

router.get(
  "/wallets/:walletId/reconcile",
  adminController.reconcileWalletBalance
);

export default router;