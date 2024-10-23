
import { Router } from "express";
import { adminLogin, adminLogout, getAdminData, getAllChats, getAllMessages, getAllUsers, getDashboardStats } from "../controllers/adminController.js";
import { adminLoginValidator, validateHandeler } from "../lib/validator.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";


export const adminRouter = Router();
adminRouter.post("/verifyadmin",adminLoginValidator(),validateHandeler,adminLogin)
adminRouter.post("/logoutadmin",adminLogout)



adminRouter.get("/admin",isAdminAuthenticated,getAdminData)
adminRouter.get("/usersadmin",isAdminAuthenticated,getAllUsers)
adminRouter.get("/chatsadmin",isAdminAuthenticated,getAllChats)
adminRouter.get("/messagesadmin",isAdminAuthenticated,getAllMessages)
adminRouter.get("/statsadmin",isAdminAuthenticated,getDashboardStats)