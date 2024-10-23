import express, { urlencoded } from "express";
import dotenv from "dotenv";
import { userRouter } from "./routes/userRouter.js";
import { dbCon } from "./constants/db_con.js";
import cookieParser from "cookie-parser";
import { chatRouter } from "./routes/chatRouter.js";
import { adminRouter } from "./routes/admin.js";
import { Server } from "socket.io";
import { createServer } from "http";
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  STOP_TYPING,
  STRAT_TYPING,
} from "./constants/event.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import { Messages } from "./models/messageModel.js";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import { corsOption } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.js";

dotenv.config();
const app = express();
const server = createServer(app);
export const userSocketIds = new Map();
export const onlineUsers = new Set();
const io = new Server(server, {
  cors: corsOption,
});

app.set("io", io);
dbCon(process.env.dbUrl);
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({ extended: true }));
app.use(cors(corsOption));
app.use("/api", userRouter);
app.use("/api", chatRouter);
app.use("/api", adminRouter);

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.resume,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});
io.on("connection", (socket) => {
  const user = socket.user;
  // console.log(user);
  userSocketIds.set(user._id.toString(), socket.id);

  // console.log(userSocketIds);
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    // console.log("chatId",chatId)
    // console.log("members",members)
    // console.log("message",message)
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };

    // console.log("Emitting:", messageForRealTime);

    const membersSocket = getSockets(members);

    // console.log("membersSocket",membersSocket)

    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });

    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });
    // console.log("New Message :",messageForRealTime)

    try {
      await Messages.create(messageForDB);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(STRAT_TYPING, ({ members, chatId }) => {
    // console.log("Start - Typing", chatId)
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STRAT_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    console.log("Stop - Typing", chatId);
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());

    const membersSocket = getSockets(members);

    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });
  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.off("disconnect", () => {
    console.log("User Disconnected.");
    userSocketIds.delete(user._id.toString());

    onlineUsers.delete(userId.toString());

    socket.broadcast.emit(ONLINE_USERS,Array.from(onlineUsers))
  });
});

const port = process.env.PORT;

export const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
server.listen(port, () => console.log(`http://localhost:${port}`));
