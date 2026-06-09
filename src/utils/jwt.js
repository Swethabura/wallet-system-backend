import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        env.jwtAccessSecret,
        {
            expiresIn: env.accessTokenExpires,
        }
    );
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        env.jwtRefreshSecret,
        {
            expiresIn: env.refreshTokenExpires,
        }
    )
};

export const verifyAccessToken = (token) => {
    return jwt.verify(
        token, 
        env.jwtAccessSecret
    );
};

export const verifyRefreshToken = (token) => {
    return jwt.verify (
        token, 
        env.jwtRefreshSecret,
    )
}