import { Router } from "express";
import {
    acceptFriendrequest,
  getAllNotifications,
  getMyFriends,
  getMyProfile,
  login,
  logout,
  register,
  searchUser,
  sendFriendRequest,
} from "../controllers/userControllers.js";
import { singleAvatar } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  acceptRequestValidator,
  loginValidator,
  registerValidator,
  sendRequestValidator,
  validateHandeler,
} from "../lib/validator.js";
// import { multerUpload } from "../middlewares/multer.js";

export const userRouter = Router();

userRouter.post(
  "/register",
  singleAvatar,
  registerValidator(),
  validateHandeler,
  register
);
userRouter.post("/login", loginValidator(), validateHandeler, login);

userRouter.get("/profile", isAuthenticated, getMyProfile);
userRouter.post("/logout", isAuthenticated, logout);
userRouter.get("/search", isAuthenticated, searchUser);
userRouter.put(
  "/sendrequest",
  isAuthenticated,
  sendRequestValidator(),
  validateHandeler,
  sendFriendRequest
);
userRouter.put(
  "/acceptrequest",
  isAuthenticated,
  acceptRequestValidator(),
  validateHandeler,
  acceptFriendrequest
);


userRouter.get("/notifications", isAuthenticated, getAllNotifications)

userRouter.get("/friends",isAuthenticated,getMyFriends)