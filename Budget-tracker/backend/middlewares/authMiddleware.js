// ./middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

/**
 * verifyToken middleware
 * - accepts token from:
 *    1) Authorization: Bearer <token>
 *    2) cookie: token
 *    3) query param: ?token=<token>
 * - normalizes req.user so that req.user.user_id, req.user.id and req.userId are always available
 */
const verifyToken = (req, res, next) => {
  try {
    // 1) Check Authorization header
    const authHeader = req.headers?.authorization;
    let token = null;

    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2) Fallback to cookie (cookie-parser must be used in server)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 3) Fallback to query param (useful for OAuth redirects that append token)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ msg: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.warn("verifyToken: JWT_SECRET is not set in environment");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalize token payload: look for common id fields
    const userId = decoded.user_id ?? decoded.id ?? decoded.userId ?? decoded.sub ?? null;

    // Build a normalized req.user object while retaining original decoded payload
    req.user = {
      ...decoded,
      id: decoded.id ?? userId,
      user_id: decoded.user_id ?? userId,
    };

    // Small convenience property
    req.userId = req.user.user_id;

    // Optional debug log (comment out in production if noisy)
    // console.log("verifyToken resolved user:", req.user);

    return next();
  } catch (err) {
    // jwt.verify throws on invalid/expired tokens
    console.error("Auth Middleware Error:", err && err.message ? err.message : err);
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

export default verifyToken;
