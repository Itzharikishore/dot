// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // make sure this matches your model file name
const mongoose = require("mongoose");

// ==================== MIDDLEWARE #1: Protect ====================
// Ensures only authenticated users can access routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    // Find user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but user does not exist anymore.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    return res.status(500).json({ success: false, message: "Authentication error" });
  }
};

// ==================== MIDDLEWARE #2: Authorize ====================
// Restrict access to specific roles (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

// ==================== MIDDLEWARE #3: Authorize Owner or Role ====================
// Ensures users can only access their own resources unless they have elevated roles
const authorizeOwnerOrRole = (...allowedRoles) => {
  return (req, res, next) => {
    const resourceUserId =
      req.params.userId || req.body.userId || req.params.patientId;

    if (!resourceUserId || !mongoose.Types.ObjectId.isValid(resourceUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const userIdStr = req.user._id.toString();
    const resourceIdStr = resourceUserId.toString();

    // Owner check
    if (userIdStr === resourceIdStr) return next();

    // Role check
    if (allowedRoles.includes(req.user.role)) return next();

    // Therapist check
    if (
      req.user.role === "therapist" &&
      req.user.assignedPatients?.some((id) => id.toString() === resourceIdStr)
    )
      return next();

    // Parent check
    if (
      req.user.role === "parent" &&
      req.user.childrenIds?.some((id) => id.toString() === resourceIdStr)
    )
      return next();

    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own resources.",
    });
  };
};

module.exports = { protect, authorize, authorizeOwnerOrRole };
