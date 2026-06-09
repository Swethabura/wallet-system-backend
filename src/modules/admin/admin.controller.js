import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/response.js";
import adminRepository from "./admin.repository.js";

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await adminRepository.getAllUsers();

  return successResponse(res, {
    message: "Users fetched successfully",
    data: users,
  });
});

const freezeUser = asyncHandler(async (req, res) => {
  const user = await adminService.freezeUser(Number(req.params.id));

  return successResponse(res, {
    message: "User frozen successfully",
    data: user,
  });
});

const activateUser = asyncHandler(async (req, res) => {
  const user = await adminService.activateUser(Number(req.params.id));

  return successResponse(res, {
    message: "User activated successfully",
    data: user,
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const stats = await walletService.getUserStats();

  return successResponse(res, {
    message: "User stats fetched successfully",
    data: stats,
  });
});

const getWalletStats = asyncHandler(async (req, res) => {
  const stats = await walletService.getWalletStats();

  return successResponse(res, {
    message: "Wallet stats fetched successfully",
    data: stats,
  });
});

const getAllWallets = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const wallets = await adminService.getAllWallets(status);

  return successResponse(res, {
    message: "Wallets fetched successfully",
    data: wallets,
  });
});

const freezeWallet = asyncHandler(async (req, res) => {
  const wallet = await adminService.freezeWallet(Number(req.params.id));

  return successResponse(res, {
    message: "Wallet frozen successfully",
    data: wallet,
  });
});

const activateWallet = asyncHandler(async (req, res) => {
  const wallet = await adminService.activateWallet(Number(req.params.id));

  return successResponse(res, {
    message: "Wallet activated successfully",
    data: wallet,
  });
});

const getLedger = asyncHandler(async (req, res) => {
  const result = await adminService.getGroupedLedgerEntries({
    walletId: req.query.walletId,
    entryType: req.query.entryType,
    transactionGroup: req.query.transactionGroup,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 10),
  });

  successResponse(res, {
    message: "Ledger fetched successfully",
    data: result,
  });
});

const getReconstructedWalletBalance = asyncHandler(async (req, res) => {
  const walletId = Number(req.params.walletId);

  const result = await adminRepository.getReconstructedWalletBalance(walletId);

  return successResponse(res, {
    message: "Wallet balance reconstructed successfully",
    data: result,
  });
});

const reconcileWalletBalance = asyncHandler(async (req, res) => {
  const walletId = Number(req.params.walletId);

  const result =
    await adminService.reconcileWalletBalance(walletId);

  return successResponse(res, {
    message: "Wallet reconciliation completed",
    data: result,
  });
});

export default {
  getAllUsers,
  freezeUser,
  activateUser,
  getUserStats,
  getWalletStats,
  getAllWallets,
  freezeWallet,
  activateWallet,
  getLedger,
  getReconstructedWalletBalance,
  reconcileWalletBalance,
};
