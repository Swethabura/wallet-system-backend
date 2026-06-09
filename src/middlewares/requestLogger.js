import crypto from "crypto";
import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    req.requestId = requestId;

    res.on("finish", () => {
        logger.info({
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration : Date.now() - start,
            ip: req.ip,
            userAgent: req.get("user-agent"),
        });
    });

    next();
}

export default requestLogger;