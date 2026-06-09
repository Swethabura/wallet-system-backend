import AppError from "../utils/AppError.js";

const csrfProtection = (req, res, next) => {
    const cookieToken = req.cookies.csrfToken;  

    const headerToken = req.header("X-CSRF-Token");

    // console.log("cookieToken ->", cookieToken);
    // console.log("headerToken ->", headerToken);

     if (
    !cookieToken ||
    !headerToken ||
    cookieToken !== headerToken
  ) {
    throw new AppError(
      "Invalid CSRF token",
      403
    );
  }

  next();
};

export default csrfProtection;