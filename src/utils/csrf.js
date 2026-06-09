import crypto from "crypto";

export const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString("hex");
}