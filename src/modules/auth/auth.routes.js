import express from "express";
import authController from "./auth.controller.js";
import csrfProtection from "../../middlewares/csrf.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post("/refresh", csrfProtection, authController.refresh);

router.post("/logout", auth, authController.logout);

router.get(
  "/profile",
  auth,
  authController.profile,
);

export default router;