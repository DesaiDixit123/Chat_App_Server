import { Chat } from "../models/chatModel.js";
import { User } from "../models/userModel.js";
import { Messages } from "../models/messageModel.js";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { secretKey } = req.body;

    console.log("secretKey:", secretKey);
    const adminSecretKey = process.env.ADMIN_SECRET_KEY || "ChatAppByDefault";

    const isMatched = secretKey === adminSecretKey;

    if (!isMatched) throw new Error("Invalid Admin Key");

    const createToken = jwt.sign(secretKey, process.env.JWT_SECRET);

    const cookieExpireTime = 1000 * 60 * 15;
    res
      .status(200)
      .cookie("admintoken", createToken, {
        maxAge: cookieExpireTime,
        httpOnly: true,
      })
      .send({
        process: true,
        message: "Authenticated Successfully , Welcome BOSS",
      });
  } catch (error) {
    res.status(401).send({
      process: false,
      message: error.message,
    });
  }
};
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("admintoken");
    res.status(200).send({
      process: true,
      message: "Logout Successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getAdminData = async (req, res) => {
  try {
    res.status(200).send({
      admin: true,
      message: "Admin Data Retrieved Successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find({});

    const transformedUsers = await Promise.all(
      allUsers.map(async ({ name, username, avatar, _id }) => {
        const [groups, friends] = await Promise.all([
          Chat.countDocuments({ groupChat: true, members: _id }),
          Chat.countDocuments({ groupChat: false, members: _id }),
        ]);

        return {
          _id,
          name,
          username,
          avatar: avatar.url,
          groups,
          friends,
        };
      })
    );

    res.status(200).send({
      process: true,
      allUsers: transformedUsers,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getAllChats = async (req, res) => {
  try {
    const allChats = await Chat.find({})
      .populate("members", "name avatar")
      .populate("creator", "name avatar");

    const transformedChats = await Promise.all(
      allChats.map(async ({ members, _id, groupChat, name, creator }) => {
        const totalMessages = await Messages.countDocuments({ chat: _id });
        return {
          _id,
          groupChat,
          name,
          avatar: members.slice(0, 3).map((member) => member.avatar.url),
          members: members.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar.url,
          })),

          creator: {
            name: creator?.name || "None",
            avatar: creator?.avatar.url || "",
          },
          totalMembers: members.length,
          totalMessages,
        };
      })
    );

    res.status(200).send({
      process: true,
      allChats: transformedChats,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const messages = await Messages.find({})
      .populate("sender", "name avatar")
      .populate("chat", "groupChat");

    const transformedMessages = messages.map(
      ({ content, attachments, _id, sender, createdAt, chat }) => ({
        _id,
        attachments,
        content,
        createdAt,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: sender
          ? {
              _id: sender._id,
              name: sender.name,
              avatar: sender.avatar.url,
            }
          : null,
      })
    );

    console.log("transformedMessages", transformedMessages);
    return res.status(200).send({
      process: true,
      messages: transformedMessages,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [groupsCount, usersCount, messagesCount, totalChatsCount] =
      await Promise.all([
        Chat.countDocuments({ groupChat: true }),
        User.countDocuments(),
        Messages.countDocuments(),
        Chat.countDocuments(),
      ]);

    const today = new Date();

    const last7Days = new Date();

    last7Days.setDate(last7Days.getDate() - 7);

    const last7DaysMessages = await Messages.find({
      createdAt: {
        $gte: last7Days,
        $lte: today,
      },
    }).select("createdAt");

    const messages = new Array(7).fill(0);
    const dayInMiliSecond = 1000 * 60 * 60 * 24;
    last7DaysMessages.forEach((message) => {
      const indexApprox =
        (today.getTime() - message.createdAt.getTime()) / dayInMiliSecond;

      const index = Math.floor(indexApprox);
      messages[6 - index]++;
    });
    const stats = {
      groupsCount,
      usersCount,
      messagesCount,
      totalChatsCount,
      messagesChart: messages,
    };
    res.status(200).send({
      process: true,
      stats,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
