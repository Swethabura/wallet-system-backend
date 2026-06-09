import withTransaction from "../../db/transaction.js";
import AppError from "../../utils/AppError.js";
import adminRepository from "./admin.repository.js";

const getAllUsers = async () => {
  return withTransaction(async (client) => {
    return await adminRepository.getAllUsers(client);
  });
};

const freezeUser = async (userId) => {
  return withTransaction(async (client) => {
    const user = await adminRepository.updateUserStatus(
      client,
      userId,
      "inactive",
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  });
};

const activateUser = async (userId) => {
  return withTransaction(async (client) => {
    const user = await adminRepository.updateUserStatus(
      client,
      userId,
      "active",
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  });
};

const getUserStats = async () => {
  return withTransaction(async (client) => {
    return await adminRepository.getUserStats(client);
  });
};

const getWalletStats = async () => {
  return withTransaction(async (client) => {
    return await adminRepository.getWalletStats(client);
  });
};

const getAllWallets = async (status) => {
  return withTransaction(async (client) => {
    return await walletRepository.getAllWallets(client, status);
  });
};

const freezeWallet = async (walletId) => {
  return withTransaction(async (client) => {
    const wallet = await walletRepository.getWalletById(client, walletId);

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    return await walletRepository.updateWalletStatus(
      client,
      walletId,
      "inactive",
    );
  });
};

const activateWallet = async (walletId) => {
  return withTransaction(async (client) => {
    const wallet = await walletRepository.getWalletById(client, walletId);

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    return await walletRepository.updateWalletStatus(
      client,
      walletId,
      "active",
    );
  });
};

const groupLedgerEntries = (rows) => {
  const grouped = {};

  for (const row of rows) {
    const groupId = row.transaction_group;

    if (!grouped[groupId]) {
      grouped[groupId] = {
        transactionGroup: groupId,
        createdAt: row.created_at,
        entries: [],
      };
    }

    grouped[groupId].entries.push({
      id: row.id,
      walletId: row.wallet_id,
      type: row.entry_type,
      amount: row.amount,
      referenceWalletId: row.reference_wallet_id,
      description: row.description,
    });
  }
  return Object.values(grouped);
};

const getGroupedLedgerEntries = async (filters) => {
  return withTransaction(async (client) => {
    const rows = await adminRepository.getLedgerEntries(client, filters);

    const groupedData = groupLedgerEntries(rows);

    return {
      data: groupedData,
      page: filters.page,
      limit: filters.limit,
    };
  });
};

const getReconstructedWalletBalance = async (walletId) => {
  return withTransaction(async (client) => {
    const result = await adminRepository.getReconstructedWalletBalance(
      client,
      walletId,
    );

    return {
      walletId: result.wallet_id,
      reconstructedBalance: Number(result.reconstructed_balance || 0),
    };
  });
};

const reconcileWalletBalance = async (walletId) => {
  return withTransaction(async (client) => {
    const wallet = await adminRepository.getWalletBalance(client, walletId);

    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    const ledger = await adminRepository.getReconstructedWalletBalance(
      client,
      walletId,
    );

    const dbBalance = Number(wallet.balance);
    const ledgerBalance = Number(ledger.reconstructed_balance || 0);

    const isMatched = dbBalance === ledgerBalance;

    return {
      walletId,
      dbBalance,
      ledgerBalance,
      isMatched,
      difference: dbBalance - ledgerBalance,
    };
  });
};

export default {
  getAllUsers,
  freezeUser,
  activateUser,
  getUserStats,
  getWalletStats,
  getAllWallets,
  freezeWallet,
  activateWallet,
  getGroupedLedgerEntries,
  getReconstructedWalletBalance,
  reconcileWalletBalance,
};
