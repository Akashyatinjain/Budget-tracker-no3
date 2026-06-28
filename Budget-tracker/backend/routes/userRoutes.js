import express from "express";
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  deleteAccount 
} from "../controllers/userController.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/me", verifyToken, updateProfile);
router.post("/change-password", verifyToken, changePassword);
router.delete("/me", verifyToken, deleteAccount);

export default router;
