import { model, Schema, Types } from "mongoose";

const chatSchema = Schema(
  {
    name: { type: String, required: true },
    groupChat: { type: Boolean, default: false },
    creator: { type:Schema.Types.ObjectId, ref: "User" },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Chat = model("Chat", chatSchema);
