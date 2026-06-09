import walletService from "./wallet.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";

const createWallet = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // console.log(req.user);

  const wallet = await walletService.createWallet(userId);

  return successResponse(res, {
    statusCode: 201,
    message: "Wallet created successfully",
    data: wallet,
  });
});

const creditWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const wallet = await walletService.creditWallet(req.user.userId, amount);

  return successResponse(res, {
    message: "Wallet credited successfully",
    data: wallet,
  });
});

const debitWallet = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const wallet = await walletService.debitWallet(req.user.userId, amount);

  return successResponse(res, {
    message: "Wallet debited successfully",
    data: wallet,
  });
});

const transferMoney = asyncHandler(async (req, res) => {
  const { toWalletId, amount } = req.body;

  const result = await walletService.transferMoney(
    req.user.userId,
    toWalletId,
    amount,
    req.idempotencyKey,
    req.requestHash,
  );

  // console.log("result ->", result);

  return res.status(200).json(result);

  // return successResponse(res, {
  //   message: "Transfer completed successfully",
  //   data: result,
  // });
});

const getMyWallet = asyncHandler(async(req, res) => {
  const wallet = await walletService.getMyWallet(req.user.userId);

  return successResponse(res, {
    message: "Wallet fetched successfully",
    data: wallet,
  });
});

const getMyLedger = asyncHandler( async(req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const ledger = await walletService.getMyLedger(req.user.userId, page, limit);

  return successResponse(res, {
    message: "Ledger fetched successfully",
    data: ledger,
  });
})

const simulateDeadlock = asyncHandler(async (req, res) => {
  const { fromWalletId, toWalletId, amount } = req.body;

  await walletService.simulateDeadlock(fromWalletId, toWalletId, amount);

  return successResponse(res, {
    message: "Deadlock simulation completed",
  });
});

export default {
  createWallet,
  creditWallet,
  debitWallet,
  transferMoney,
  getMyWallet,
  getMyLedger,
  simulateDeadlock,
};
