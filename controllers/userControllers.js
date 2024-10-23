import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NEW_REQUEST, REFECTH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chatModel.js";
import { Request } from "../models/requestModel.js";
import { User } from "../models/userModel.js";
import { emitEvent, uploadFilesToCloadinary } from "../utils/features.js";
import { USER_TOKEN } from "../constants/config.js";
export const register = async (req, res) => {
  try {
    const { name, username, password, bio, confirmPassword } = req.body;

    console.log(req.file);
    const file = req.file;

    if (!file) throw new Error("Please Upload Avatar.");

    const result = await uploadFilesToCloadinary([file]);

    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const exctingUser = await User.findOne({
      $or: [{ username }],
    });

    if (exctingUser) throw new Error("User already exists.");

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User({
      name,
      username,
      password: hashPassword,
      bio,
      avatar: {
        url: avatar.url,
        public_id: avatar.public_id,
      },
    }).save();

    const createToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    console.log(createToken);

    await User.findByIdAndUpdate(user._id, { token: createToken });

    const cookieExpireTime = 15 * 24 * 60 * 60 * 1000;
    res
      .status(201)
      .cookie("userCookie", createToken, {
        maxAge: cookieExpireTime,
        httpOnly: true,
        user,
      })
      .send({
        process: true,
        message: "Register Successfully.",
        user,
      });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: "Failed to register user: " + error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) throw new Error("All fields are requried.");

    const user = await User.findOne({ username }).select("+password");
    console.log("User found in database:", user);

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Password Incorrect");
    }

    if (isPasswordValid) {
      const createToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "15d",
      });
      await User.findByIdAndUpdate(user._id, { token: createToken });

      const cookieExpireTime = 15 * 24 * 60 * 60 * 1000;
      res
        .status(200)
        .cookie(USER_TOKEN, createToken, {
          maxAge: cookieExpireTime,
          httpOnly: true,
          user,
        })
        .send({
          process: true,
          message: "Login Successfully.",
          user,
        });
    }
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      // Return early to prevent further execution
      return res.status(404).json({ message: "User not found." });
    }

    // Send response and return to prevent additional responses
    res.status(200).send({
      success: true,
      user,
    });
  } catch (error) {
    // Error handling - only one response will be sent
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("userCookie");
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

export const searchUser = async (req, res) => {
  try {
    const { name = "" } = req.query;

    const myChats = await Chat.find({ groupChat: false, members: req.user });

    // All Users from My Chats means Friends or pepole i have chatted with

    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

    // console.log(allUsersFromMyChats);
    console.log("Users available in DB:", await User.find({}));
    const allUsersExceptMeAndFriends = await User.find({
      _id: { $nin: allUsersFromMyChats },
      name: { $regex: name, $options: "i" },
    });
    // console.log("allUsersExceptMeAndFriends :",allUsersExceptMeAndFriends)

    const users = allUsersExceptMeAndFriends.map((i) => ({
      ...i,
      avatar: i.avatar.url,
    }));
    res.status(200).send({
      process: true,
      users,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    const request = await Request.findOne({
      $or: [
        {
          sender: req.user._id,
          receiver: userId,
        },
        {
          sender: userId,
          receiver: req.user._id,
        },
      ],
    });

    if (request) throw new Error("Request alraedy sent.");

    await Request.create({
      sender: req.user._id,
      receiver: userId,
    });

    emitEvent(req, NEW_REQUEST, [userId], "request");
    res.status(200).send({
      process: true,
      message: "Friend Request Sent Successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const acceptFriendrequest = async (req, res) => {
  try {
    const { requestId, accept } = req.body;

    const request = await Request.findById(requestId)
      .populate("sender", "name")
      .populate("receiver", "name");

    if (!request) throw new Error("Request not found.");

    // console.log("Receiver ID:", request.receiver._id); // Log receiver's ID from request
    // console.log("User ID:", req.user._id); // Log logged-in user's ID

    if (request.receiver._id?.toString() !== req.user._id?.toString())
      throw new Error("You are not authorized to accept this request.");

    if (!accept) {
      await request.deleteOne();

      return res.status(200).send({
        process: true,
        message: "Friend request rejected.",
      });
    }
    // console.count("Accepting friend request")
    const members = [request.sender._id, request.receiver._id];
    // console.count("Accepting friend request")
    await Promise.all([
      Chat.create({
        members,
        name: `${request.sender.name} - ${request.receiver.name}`,
      }),
      request.deleteOne(),
    ]);

    emitEvent(req, REFECTH_CHATS, members);
    res.status(200).send({
      process: true,
      message: "Friend Request Accepted",
      senderId: request.sender._id,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const request = await Request.find({ receiver: req.user._id }).populate(
      "sender",
      "name avatar"
    );

    console.log(req.user._id);

    const allRequest = request.map(({ _id, sender }) => ({
      _id,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar.url,
      },
    }));

    res.status(200).send({
      process: true,
      allRequest,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
export const getMyFriends = async (req, res) => {
  try {
    const chatId = req.query.chatId;

    const chats = await Chat.find({
      members: req.user,
      groupChat: false,
    }).populate("members", "name avatar");

    const friends = chats.map(({ members }) => {
      const otheUser = getOtherMember(members, req.user._id);
      return {
        _id: otheUser._id,
        name: otheUser.name,
        avatar: otheUser.avatar.url,
      };
    });

    if (chatId) {
      const chat = await Chat.findById(chatId);

      const availableFriends = friends.filter(
        (frnd) => !chat.members.includes(frnd._id)
      );

      console.log(availableFriends);
      res.status(200).send({
        process: true,
        availableFriends,
      });
    } else {
      res.status(200).send({
        process: true,
        friends,
      });
    }
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
