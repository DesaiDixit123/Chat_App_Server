import { model, Schema } from "mongoose";

const requestSchema = Schema(
  {
    status: {
      type: String,
      default: "pending",
      enum:["pending","accepted","rejected"]
    },
  
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Request = model("Request", requestSchema);
