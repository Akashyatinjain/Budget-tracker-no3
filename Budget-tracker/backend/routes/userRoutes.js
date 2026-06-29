import express from "express";
import { 
  getProfile, 
  updateProfile, 
  uploadAvatar,
  changePassword, 
  deleteAccount 
} from "../controllers/userController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/me", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/me", verifyToken, updateProfile);
router.post("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);
router.post("/change-password", verifyToken, changePassword);
router.delete("/me", verifyToken, deleteAccount);

export default router;
