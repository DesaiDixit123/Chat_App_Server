import mongoose from "mongoose";
import {
  ALERT,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFECTH_CHATS,
} from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { Chat } from "../models/chatModel.js";
import { Messages } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import {
  deleteFilesFromCloudinary,
  emitEvent,
  uploadFilesToCloadinary,
} from "../utils/features.js";

export const newGroupChat = async (req, res) => {
  try {
    const { name, members } = req.body;

    const allMembers = [...members, req.user];

    await Chat.create({
      name,
      groupChat: true,
      creator: req.user,
      members: allMembers,
    });

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    emitEvent(req, REFECTH_CHATS, members);

    res.status(201).send({
      process: true,
      message: "Group Created",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id }).populate(
      "members",
      "name avatar"
    );

    // console.log(chats)


    // console.log("members",members)



    
  

    const transformedChats = chats.map(({ _id, name, groupChat, members }) => {
      const otherMember = getOtherMember(members, req.user._id);

      // console.log("otherMember",otherMember)
      return {
        _id,
        groupChat,
        avatar: groupChat
          ? members.slice(0, 3).map(({ avatar }) => avatar.url)
          : [otherMember.avatar.url],
        name: groupChat ? name : otherMember.name,
        members: members.reduce((prev, curr) => {
          if (curr._id?.toString() !== req.user._id?.toString()) {
            prev.push(curr._id);
          }

          return prev;
        }, []),
      };
    });

    // console.log("transformedChats",transformedChats)
  
    res.status(200).send({
      process: true,
      chats: transformedChats,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const chats = await Chat.find({
      members: req.user,
      groupChat: true,
      creator: req.user,
    }).populate("members", "name avatar");

    const groups = chats.map(({ members, _id, groupChat, name }) => ({
      _id,
      groupChat,
      name,
      avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
    }));

    res.status(200).send({
      process: true,
      groups: groups,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

// export const addMembers = async (req, res) => {
//   try {
//     const { chatId, members } = req.body;

//     if (!members || members.length < 1)
//       throw new Error("Please provide members.");

//     const chat = await Chat.findById(chatId);
//     if (!chat) throw new Error("Chat Not Found.");
//     if (!chat.groupChat) throw new Error("This is not a group chat");

//     if (chat.creator?.toString() !== req.user._id?.toString())
//       throw new Error("You are not allowed to add members");

//     const allNewMembersPromise = members.map((i) => User.findById(i, "name"))

//     const allNewMembers = await Promise.all(allNewMembersPromise)

//     const existingMembers = [];
//     const uniqueMembers = allNewMembers
//       .filter((i) => {
//         const isExisting = chat.members.some(
//           (member) => member?.toString() === i._id?.toString()
//         );
//         if (isExisting) {
//           existingMembers.push(i.name);
//           return false;
//         }
//         return true;
//       })
//       .map((i) => i._id);

//     if (uniqueMembers.length === 0 && existingMembers.length > 0) {
//       throw new Error(
//         `These users are already in the group: ${existingMembers.join(", ")}`
//       );
//     }

//     chat.members.push(...uniqueMembers);

//     if (chat.members.length > 100)
//       throw new Error("Group members limit reached.");

//     await chat.save();

//     const allUsersName = allNewMembers.map((i) => i.name).join(",");

//     emitEvent(
//       req,
//       ALERT,
//       chat.members,
//       `${allUsersName} has been added to the group`
//     );
//     emitEvent(req, REFECTH_CHATS, chat.members);

//     res.status(200).send({
//       process: true,
//       message: "Members added successfully.",
//     });
//   } catch (error) {
//     res.status(400).send({
//       process: false,
//       message: error.message,
//     });
//   }
// };

export const addMembers = async (req, res) => {
  try {
    const { chatId, members } = req.body;

    if (!members || members.length < 1)
      throw new Error("Please provide members.");

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat Not Found.");
    if (!chat.groupChat) throw new Error("This is not a group chat");

    if (chat.creator?.toString() !== req.user._id?.toString())
      throw new Error("You are not allowed to add members");

    const allNewMembersPromise = members.map((i) => User.findById(i, "name"));
    const allNewMembers = await Promise.all(allNewMembersPromise);

    const existingMembers = [];
    const uniqueMembers = allNewMembers
      .filter((i) => {
        const isExisting = chat.members.some(
          (member) => member?.toString() === i._id?.toString()
        );
        if (isExisting) {
          existingMembers.push(i.name);
          return false;
        }
        return true;
      })
      .map((i) => i._id);

    if (uniqueMembers.length === 0 && existingMembers.length > 0) {
      throw new Error(
        `These users are already in the group: ${existingMembers.join(", ")}`
      );
    }

    chat.members.push(...uniqueMembers);

    if (chat.members.length > 100)
      throw new Error("Group members limit reached.");

    await chat.save();

    // Get only newly added members' names
    const newlyAddedNames = allNewMembers
      .filter((i) => uniqueMembers.includes(i._id))
      .map((i) => i.name)
      .join(", ");

    // Log for debugging purposes
    console.log("Newly Added Users:", newlyAddedNames);
    console.log("Chat Members:", chat.members);

    emitEvent(req, ALERT, chat.members, {
      message: `${newlyAddedNames} has been added to the group`,
      chatId,
    });

    emitEvent(req, REFECTH_CHATS, chat.members);

    res.status(200).send({
      process: true,
      message: "Members added successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const removeGroup = async (req, res) => {
  try {
    const { userId, chatId } = req.body;
    const [chat, userThatWillBeRemoved] = await Promise.all([
      Chat.findById(chatId),
      User.findById(userId, "name"),
    ]);

    if (!chat) throw new Error("Chat Not Found.");
    if (!chat.groupChat) throw new Error("This is not a group chat");
    console.log("Chat Creator:", chat.creator?.toString());
    console.log("Current User (ID):", req.user?.toString());
    if (chat.creator?.toString() !== req.user._id?.toString()) {
      throw new Error("You are not allowed to remove members");
    }
    if (chat.creator?.toString() === userId?.toString()) {
      throw new Error(
        "As the group admin, you cannot remove yourself from the group."
      );
    }

    if (chat.members.length <= 3)
      throw new Error("Group must have at least 3 members.");

    const allChatMembers = chat.members.map((i) => i.toString());
    chat.members = chat.members.filter(
      (member) => member?.toString() !== userId?.toString()
    );

    await chat.save();

    emitEvent(req, ALERT, chat.members, {
      message: `${userThatWillBeRemoved.name} has been removed from the group.`,
      chatId,
    });

    emitEvent(req, REFECTH_CHATS, allChatMembers);

    res.status(200).send({
      process: true,
      message: "Members removed successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
export const leaveGroup = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);

    if (!chat) throw new Error("Chat Not Found.");
    if (!chat.groupChat) throw new Error("This is not a group chat");

    const remainingMember = chat.members.filter(
      (member) => member?.toString() !== req.user?.toString()
    );
    if (remainingMember.length < 3)
      throw new Error("Group must have at least 3 members ");
    if (chat.creator?.toString() === req.user?.toString()) {
      const randomElement = Math.floor(Math.random() * remainingMember.length);

      const newCreator = remainingMember[randomElement];
      chat.creator = newCreator;
    }

    chat.members = remainingMember;
    const user = await Promise.all([
      User.findById(req.user, "name"),
      chat.save(),
    ]);

    emitEvent(req, ALERT, chat.members, {
      message: `User  ${user.name} has left the group.`,
      chatId,
    });

    emitEvent(req, REFECTH_CHATS, chat.members);

    res.status(200).send({
      process: true,
      message: "You have successfully left the group chat.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
export const sendAttachments = async (req, res) => {
  try {
    const { chatId } = req.body;

    const files = req.files || [];

    console.log(files);
    if (files.length < 1) throw new Error("Please Upload Attachments");
    if (files.length > 5) throw new Error("Files can't br more than 5");

    const [chat, me] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user, "name"),
    ]);

    if (!chat) throw new Error("Chat Not Found.");

    if (files.length > 1) throw new Error("Please Provide attachments.");

    // Upload files here

    const attachments = await uploadFilesToCloadinary(files);

    const messageForDB = {
      content: "",
      attachments,
      sender: me._id,
      chat: chatId,
    };
    const messageForRealTime = {
      ...messageForDB,
      sender: {
        _id: me._id,
        name: me.name,
      },
    };
    const message = await Messages.create(messageForDB);
    emitEvent(req, NEW_MESSAGE, chat.members, {
      message: messageForRealTime,
      chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, {
      chatId,
    });

    res.status(200).send({
      process: true,
      message,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getChatDetails = async (req, res) => {
  try {
    if (req.query.populate === "true") {
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name avatar")
        .lean();

      console.log(chat);

      if (!chat) throw new Error("Chat not found");

      chat.members = chat.members.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url,
      }));

      res.status(200).send({
        process: true,
        chat,
      });
    } else {
      const chat = await Chat.findById(req.params.id);

      if (!chat) throw new Error("Chat not found");

      res.status(200).send({
        process: false,
        chat,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const renameGroup = async (req, res) => {
  try {
    const chatId = req.params.id;

    const { name } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    if (!chat.groupChat) throw new Error("This is not a group chat.");
    console.log("chat.creator:", chat.creator);
    console.log("req.user:", req.user._id);
    if (chat.creator?.toString() !== req.user._id?.toString())
      throw new Error("You are not allowed to rename the group");

    chat.name = name;
    await chat.save();
    emitEvent(req, REFECTH_CHATS, chat.members);

    res.status(200).send({
      process: true,
      message: "Group renamed successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    const members = chat.members;

    if (chat.groupChat && chat.creator.toString() !== req.user._id.toString())
      throw new Error("You are not allowed to delete the group.");

    if (!chat.groupChat && !chat.members.includes(req.user._id.toString()))
      throw new Error("You are not allowed to delete the chat.");

    // here we have to deleteall messages as well as attachments or files from cloudinary

    const messagesWithAttachments = await Messages.find({
      chat: chatId,
      attachments: { $exists: true, $ne: [] },
    });

    const public_ids = [];

    messagesWithAttachments.forEach(({ attachments }) => {
      attachments.forEach(({ public_id }) => public_ids.push(public_id));
    });

    await Promise.all([
      // DeleteFiles from Cloudinary
      deleteFilesFromCloudinary(public_ids),
      chat.deleteOne(),
      Messages.deleteMany({ chat: chatId }),
    ]);

    emitEvent(req, REFECTH_CHATS, members);
    res.status(200).send({
      process: true,
      message: "Chat deleted successfully.",
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const chatId = req.params.id;
    const { page = 1 } = req.query;
    const resultPerPage = 20;

    const skip = (page - 1) * resultPerPage;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new Error("Chat not found");

    if (!chat.members.includes(req.user._id.toString()))
      throw new Error("You are not allowed to access this route");

    const [messages, totalMessagesCount] = await Promise.all([
      Messages.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("sender", "name avatar")
        .lean(),
      Messages.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / resultPerPage);
    res.status(200).send({
      process: true,
      messages: messages.reverse(),
      totalPages,
    });
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
