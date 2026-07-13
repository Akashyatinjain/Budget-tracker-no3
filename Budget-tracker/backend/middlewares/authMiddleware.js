import jwt from "jsonwebtoken";


const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    let token = null;

    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

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

    const userId = decoded.user_id ?? decoded.id ?? decoded.userId ?? decoded.sub ?? null;

    req.user = {
      ...decoded,
      id: decoded.id ?? userId,
      user_id: decoded.user_id ?? userId,
    };

    req.userId = req.user.user_id;


    return next();
  } catch (err) {
    console.error("Auth Middleware Error:", err && err.message ? err.message : err);
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

export default verifyToken;
