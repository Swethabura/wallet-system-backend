import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

const auth = (
  req,
  res,
  next
) => {
  const token =
    req.cookies.accessToken;

  if (!token) {
    throw new AppError(
      "Authentication required",
      401
    );
  }

  try {
    const decoded =
      verifyAccessToken(token);

    req.user = decoded;

    // console.log(req.user)

    next();
  } catch {
    throw new AppError(
      "Invalid or expired token",
      401
    );
  }
};

export default auth;