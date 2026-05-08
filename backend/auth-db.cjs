const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("./db.cjs");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 20) {
    throw new Error("JWT_SECRET is missing or too short in backend/.env");
  }

  return secret;
}

function ensureAdminUser() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "CloudOps@123";

  const existing = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  const passwordHash = bcrypt.hashSync(password, 12);

  if (!existing) {
    db.prepare(`
      INSERT INTO users (username, role, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(username, "admin", passwordHash);

    return;
  }

  if (!existing.password_hash) {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE username = ?
    `).run(passwordHash, username);
  }
}

function loginUser(username, password) {
  ensureAdminUser();

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user || !user.password_hash) {
    return null;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);

  if (!valid) {
    return null;
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role
    },
    getJwtSecret(),
    {
      expiresIn: "12h"
    }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Missing authentication token"
    });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token"
    });
  }
}

module.exports = {
  ensureAdminUser,
  loginUser,
  verifyToken,
  authMiddleware
};
