import withTransaction from "../../db/transaction.js";
import AppError from "../../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { hashToken } from "../../utils/tokenHash.js";
import authRepository from "./auth.repository.js";

const register = async ({ email, password, fullName }) => {
  return withTransaction(async (client) => {
    if(!email || !password || !fullName) {
        throw new AppError("All fields are required", 400);
    }
    const existing = await authRepository.getUserByEmail(client, email);

    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await authRepository.createUser(client, {
      email,
      passwordHash,
      fullName,
    });

    return user;
  });
};

const login = async ({ email, password }) => {
  return withTransaction(async (client) => {

    if(!email || !password ) {
        throw new AppError("Email and Password are required", 400);
    }

    const user = await authRepository.getUserByEmail(client, email);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const valid = await comparePassword(password, user.password_hash);

    if (!valid) {
      throw new AppError("Invalid credentials", 401);
    }

    if (user.status !== "active") {
      throw new AppError("Account inactive", 403);
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    await authRepository.storeRefreshToken(client, {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  });
};

const refresh = async (token) => {
  return withTransaction(async (client) => {
    verifyRefreshToken(token);

    const tokenHash = hashToken(token);

    const existing = await authRepository.getValidRefreshToken(
      client,
      tokenHash,
    );

    if (!existing) {
      throw new AppError("Invalid refresh token", 401);
    };

    const user = await authRepository.getUserById(
      client,
      existing.user_id
    );

    if (!user || user.status !== "active") {
      throw new AppError("Account inactive", 403);
    }

    await authRepository.revokeRefreshToken(client, tokenHash);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    await authRepository.storeRefreshToken(client, {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
        accessToken,
        refreshToken,
    }
  });
};

const logout = async (token) => {
  return withTransaction(async (client) => {
    await authRepository.revokeRefreshToken(
      client,
      hashToken(token)
    );
  });
};

const profile = async(userId) => {
  return withTransaction(async(client) => {
    const user = await authRepository.getUserById(client, userId);
    
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  })
}

export default {
  register,
  login,
  refresh,
  logout,
  profile,
};
