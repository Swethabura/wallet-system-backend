import express from "express";
import cors from "cors";
import requestLogger from "./middlewares/requestLogger.js";
import errorHandler from "./middlewares/errorHandler.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Wallet system is running",
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/admin", adminRoutes);

app.use(errorHandler);

export default app;