import { JsonWebToken } from "jsonwebtoken";
import {userSchema} from "../models/userModel.js";
import {refreshTokenSchema} from "../models/refreshTokenModel.js";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    JsonWebToken.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    } );
};

const verifyRefreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    try {
        const storedToken = await refreshTokenSchema.findOne({ token: refreshToken });
        if (!storedToken) return res.sendStatus(403);

        JsonWebToken.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

export { authenticateToken, verifyRefreshToken };