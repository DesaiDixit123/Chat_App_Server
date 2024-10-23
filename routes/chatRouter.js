import { Router } from "express";
import {
  addMembers,
  deleteChat,
  getChatDetails,
  getMessages,
  getMyChats,
  getMyGroups,
  leaveGroup,
  newGroupChat,
  removeGroup,
  renameGroup,
  sendAttachments,
} from "../controllers/chatController.js";
import {
  addMemberValidator,
  chatIdValidator,
  newGroupValidator,
  removeMemberValidator,
  renameChatValidator,
  sendAttachmentValidator,
  validateHandeler,
} from "../lib/validator.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { attachmentMulter } from "../middlewares/multer.js";

export const chatRouter = Router();

chatRouter.post(
  "/group/new",
  isAuthenticated,
  newGroupValidator(),
  validateHandeler,
  newGroupChat
);
chatRouter.get("/my", isAuthenticated, getMyChats);
chatRouter.get("/my/groups", isAuthenticated, getMyGroups);
chatRouter.put(
  "/addmembers",
  isAuthenticated,
  addMemberValidator(),
  validateHandeler,
  addMembers
);
chatRouter.delete(
  "/removemembers",
  isAuthenticated,
  removeMemberValidator(),
  validateHandeler,
  removeGroup
);
chatRouter.delete(
  "/leave/:id",
  isAuthenticated,
  chatIdValidator(),
  validateHandeler,
  leaveGroup
);
chatRouter.post(
  "/chat/message",
  isAuthenticated,
  attachmentMulter,
  sendAttachmentValidator(),
  validateHandeler,
  sendAttachments
);

chatRouter.get(
  "/chat/message/:id",
  isAuthenticated,
  chatIdValidator(),
  validateHandeler,
  getMessages
);
chatRouter
  .route("/chat/:id")
  .get(isAuthenticated, chatIdValidator(), validateHandeler, getChatDetails)
  .put(isAuthenticated, renameChatValidator(), validateHandeler, renameGroup)
  .delete(isAuthenticated, chatIdValidator(), validateHandeler, deleteChat);
