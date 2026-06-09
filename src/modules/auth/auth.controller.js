import asyncHandler from "../../utils/asyncHandler.js";
import { clearAuthCookies, setAuthCookies } from "../../utils/cookies.js";
import { generateCsrfToken } from "../../utils/csrf.js";
import { successResponse } from "../../utils/response.js";
import authService from "./auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "strict",
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  return successResponse(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: user,
  });
});

const login = asyncHandler(async(req, res) => {
    const result = await authService.login(req.body);

    const csrfToken = generateCsrfToken();

    setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        csrfToken,
    });

    return successResponse(res, {
      message: "Login successful",
      data: result.user,
    });
});

const refresh = asyncHandler(async(req, res) => {
    const token = req.cookies.refreshToken;

    const result = await authService.refresh(token);

    const csrfToken = generateCsrfToken();

    setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        csrfToken,
    });

    return successResponse(res, {
      message:
        "Tokens refreshed successfully",
    });
});

const logout = asyncHandler(async(req, res) => {
    const token = req.cookies.refreshToken;

    await authService.logout(token);

    clearAuthCookies(res);

    return successResponse(res, {
         message:
        "Logged out successfully",
    })
});

const profile = asyncHandler(async (req, res) => {
  const user = await authService.profile(
    req.user.userId
  );

  return successResponse(res, {
    message: "User fetched successfully",
    data: user,
  });
});

export default {
  register,
  login,
  refresh,
  logout,
  profile,
};