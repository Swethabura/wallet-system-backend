import pino from "pino";
import env from "./env.js";

const transport = env.nodeEnv === "development" ? {
    target: "pino-pretty",
    options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid, hostname",
    }
} : undefined;

const logger = pino({
    level: env.logLevel || "info",
    transport,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;