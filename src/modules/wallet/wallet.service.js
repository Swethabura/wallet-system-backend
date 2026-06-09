import logger from "../../config/logger.js";
import withTransaction from "../../db/transaction.js";
import { publishEvent } from "../../queues/publisher.js";
import AppError from "../../utils/AppError.js";
import outboxRepository from "../outbox/outbox.repository.js";
import walletRepository from "./wallet.repository.js";
import crypto from "crypto";

const createWallet = async (userId) => {
  return withTransaction(async (client) => {
    const existingWallet = await walletRepository.getWalletByUserId(
      client,
      userId,
    );

    if (existingWallet) {
      throw new AppError("Wallet already exist for this user", 409);
    }

    const wallet = await walletRepository.createWallet(client, userId);

    logger.info({
      action: "CREATE_WALLET",
      walletId: wallet.id,
      userId,
    });

    return wallet;
  });
};

const creditWallet = async (userId, amount) => {
  if (amount <= 0) {
    throw new AppError("Amount must be greater than zero", 400);
  }

  return withTransaction(async (client) => {
    const wallet = await walletRepository.getWalletByUserIdForUpdate(
      client,
      userId,
    );

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    if (wallet.status !== "active") {
      throw new AppError("Wallet is inactive", 403);
    }

    logger.info({
      action: "CREDIT_LOCK_ACQUIRED",
      walletId: wallet.id,
      currentBalance: wallet.balance,
    });

    const newBalance = Number(wallet.balance) + Number(amount);

    const updatedWallet = await walletRepository.updateWalletBalance(
      client,
      wallet.id,
      newBalance,
    );

    await walletRepository.insertLedgerEntry(client, {
      walletId: wallet.id,
      entryType: "credit",
      amount,
      description: "Wallet credited",
    });

    await outboxRepository.createOutboxEvent(client, {
      eventType: "wallet_credit_completed",
      routingKey: "wallet.credit.completed",
      payload: {
        eventId: crypto.randomUUID(),
        walletId: wallet.id,
        amount,
        timestamp: new Date(),
      },
    });

    logger.info({
      action: "CREDIT_SUCCESS",
      walletId: wallet.id,
      amount,
      previousBalance: wallet.balance,
      newBalance,
    });

    return updatedWallet;
  });
};

const debitWallet = async (userId, amount) => {
  if (amount <= 0) {
    throw new AppError("Amount must be greater than zero", 400);
  }

  return withTransaction(async (client) => {
    const wallet = await walletRepository.getWalletByUserIdForUpdate(
      client,
      userId,
    );

    if (wallet.status !== "active") {
      throw new AppError("Wallet is inactive", 403);
    }

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    logger.info({
      action: "DEBIT_LOCK_ACQUIRED",
      walletId: wallet.id,
      currentBalance: wallet.balance,
    });

    if (Number(wallet.balance) < Number(amount)) {
      throw new AppError("Insufficient balance", 400);
    }

    const newBalance = Number(wallet.balance) - Number(amount);

    const updatedWallet = await walletRepository.updateWalletBalance(
      client,
      wallet.id,
      newBalance,
    );

    await walletRepository.insertLedgerEntry(client, {
      walletId: wallet.id,
      entryType: "debit",
      amount,
      description: "Wallet debited",
    });

    await outboxRepository.createOutboxEvent(client, {
      eventType: "wallet_debit_completed",
      routingKey: "wallet.debit.completed",
      payload: {
        eventId: crypto.randomUUID(),
        walletId: wallet.id,
        amount,
        timestamp: new Date(),
      },
    });

    logger.info({
      action: "DEBIT_SUCCESS",
      walletId: wallet.id,
      amount,
      previousBalance: wallet.balance,
      newBalance,
    });

    return updatedWallet;
  });
};

const transferMoney = async (
  userId,
  toWalletId,
  amount,
  idempotencyKey,
  requestHash,
) => {
  if (amount <= 0) {
    throw new AppError("Amount must be greater than zero", 400);
  }

  return withTransaction(async (client) => {
    const fromWallet = await walletRepository.getWalletByUserIdForUpdate(
      client,
      userId,
    );

    if (!fromWallet) {
      throw new AppError("Source wallet not found", 404);
    }

    if (fromWallet.status !== "active") {
      throw new AppError("Source wallet is inactive", 403);
    }

    const fromWalletId = Number(fromWallet.id);

    if (fromWalletId === toWalletId) {
      throw new AppError("Cannot transfer to the same wallet", 400);
    }

    if (idempotencyKey) {
      const existing = await walletRepository.getIdempotencyKey(
        client,
        userId,
        idempotencyKey,
      );

      if (existing?.response_payload) {
        return existing.response_payload;
      }

      if (existing && existing.request_hash !== requestHash) {
        throw new AppError(
          "Request payload does not match original idempotent request",
          409,
        );
      }

      await walletRepository.createIdempotencyKey(
        client,
        userId,
        idempotencyKey,
        // JSON.stringify({ fromWalletId, toWalletId, amount }),
        requestHash,
      );
    }

    const wallets = await walletRepository.getWalletForTransfer(
      client,
      fromWalletId,
      toWalletId,
    );

    // console.log("wallets ->", wallets);

    if (wallets.length !== 2) {
      throw new AppError("One or both wallets not found", 404);
    }

    const toWallet = wallets.find((wallet) => Number(wallet.id) === toWalletId);

    if (toWallet.status !== "active") {
      throw new AppError("Destination wallet is inactive", 403);
    }

    logger.info({
      action: "TRANSFER_LOCKS_ACQUIRED",
      fromWalletId,
      toWalletId,
    });

    // await new Promise((resolve) => setTimeout(resolve, 5000));

    if (Number(fromWallet.balance) < Number(amount)) {
      throw new AppError("Insufficient balance", 400);
    }

    const transactionGroup = crypto.randomUUID();

    const updatedFrom = await walletRepository.updateWalletBalance(
      client,
      fromWalletId,
      Number(fromWallet.balance) - Number(amount),
    );

    const updatedTo = await walletRepository.updateWalletBalance(
      client,
      toWalletId,
      Number(toWallet.balance) + Number(amount),
    );

    await walletRepository.insertLedgerEntry(client, {
      walletId: fromWalletId,
      entryType: "debit",
      amount,
      referenceWalletId: toWalletId,
      transactionGroup,
      description: "Transfer sent",
    });

    await walletRepository.insertLedgerEntry(client, {
      walletId: toWalletId,
      entryType: "credit",
      amount,
      referenceWalletId: fromWalletId,
      transactionGroup,
      description: "Transfer received",
    });

    logger.info({
      action: "TRANSFER_SUCCESS",
      fromWalletId,
      toWalletId,
      amount,
    });

    await outboxRepository.createOutboxEvent(client, {
      eventType: "wallet_transfer_completed",
      routingKey: "wallet.transfer.completed",
      payload: {
        fromWalletId,
        toWalletId,
        transactionGroup,
        timeStamp: new Date(),
      },
    });

    const result = {
      fromWallet: updatedFrom,
      toWallet: updatedTo,
    };

    const response = {
      success: true,
      message: "Transfer completed successfully",
      data: result,
    };

    // console.log("response ->", response);

    if (idempotencyKey) {
      await walletRepository.updateIdempotencyResponse(
        client,
        userId,
        idempotencyKey,
        response,
        200,
      );
    }

    return response;
  });
};

const getMyWallet = async (userId) => {
  return withTransaction(async (client) => {
    const wallet = await walletRepository.getWalletByUserId(client, userId);

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }
    return wallet;
  });
};

const getMyLedger = async (userId, page = 1, limit = 10) => {
  return withTransaction(async (client) => {
    const wallet = await walletRepository.getWalletByUserId(client, userId);

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    return await walletRepository.getWalletLedger(client, wallet.id, page, limit);
  });
};

const simulateDeadlock = async (fromWalletId, toWalletId, amount) => {
  return withTransaction(async (client) => {
    logger.info({
      action: "LOCKING_FIRST_WALLET",
      walletId: fromWalletId,
    });

    const fromWallet = await walletRepository.getWalletByIdForUpdateUnsafe(
      client,
      fromWalletId,
    );

    await new Promise((resolve) => setTimeout(resolve, 3000));

    logger.info({
      action: "LOCKING_SECOND_WALLET",
      walletId: toWalletId,
    });

    const toWallet = await walletRepository.getWalletByIdForUpdateUnsafe(
      client,
      toWalletId,
    );

    if (Number(fromWallet.balance) < Number(amount)) {
      throw new AppError("Insufficient balance", 400);
    }

    await walletRepository.updateWalletBalance(
      client,
      fromWalletId,
      Number(fromWallet.balance) - Number(amount),
    );

    await walletRepository.updateWalletBalance(
      client,
      toWalletId,
      Number(toWallet.balance) + Number(amount),
    );

    logger.info({
      action: "DEADLOCK_TEST_SUCCESS",
    });

    return true;
  });
};

export default {
  createWallet,
  creditWallet,
  debitWallet,
  transferMoney,
  getMyWallet,
  getMyLedger,
  simulateDeadlock,
};
