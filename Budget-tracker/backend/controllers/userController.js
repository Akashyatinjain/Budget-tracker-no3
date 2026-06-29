import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../services/cloudinary.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  updateUserPassword,
  deleteUser,
} from "../models/userModel.js";

// ✅ Signup Controller
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // 1️⃣ Check existing user
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create user
    const newUser = await createUser({
      username: username || email.split("@")[0],
      email,
      password: hashedPassword,
    });

    // 4️⃣ Generate token
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email, role: newUser.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      msg: "User registered successfully",
      user: newUser,
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Login Controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // 1️⃣ Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // 3️⃣ Create JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const fullUser = await findUserById(user.user_id);

    res.json({
      msg: "Login successful",
      user: fullUser || {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Profile (Protected)
export const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.user_id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Profile (Protected)
export const updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const updated = await updateUser(user_id, req.body);
    res.json({ msg: "Profile updated successfully", user: updated });
  } catch (err) {
    console.error("Update profile controller error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Upload Profile Avatar (Protected)
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please provide an image file" });
    }
    const userId = req.user?.user_id ?? req.user?.id ?? req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User ID missing from authentication token" });
    }

    const localFilePath = req.file.path;
    const result = await uploadOnCloudinary(localFilePath);

    if (!result || !result.secure_url) {
      return res.status(500).json({ error: "Cloudinary upload failed" });
    }

    const avatarUrl = result.secure_url;
    const updatedUser = await updateUser(userId, {
      avatar_url: avatarUrl,
      avatar: avatarUrl,
      profile_picture: avatarUrl,
    });

    res.json({
      msg: "Avatar uploaded successfully",
      avatar_url: avatarUrl,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Upload avatar error:", err);
    res.status(500).json({ error: err.message || "Upload avatar failed" });
  }
};

// ✅ Change Password (Protected)
export const changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ msg: "Current password and new password are required" });
    }

    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await updateUserPassword(user_id, hashed);

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Account (Protected)
export const deleteAccount = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    await deleteUser(user_id);
    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
