import env from "../config/env.js";
import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error({
    err,
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    // message: err.message,
    // statusCode: err.statusCode,
    // stack: env.nodeEnv === "development" ? err.stack : undefined,
  });

   res.status(statusCode).json({
    success: false,
    message:
      err.isOperational || env.nodeEnv === "development"
        ? err.message
        : "Internal Server Error",
    requestId: req.requestId,
  });
};

export default errorHandler;