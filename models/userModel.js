import { model, Schema } from "mongoose";


const userSchema = Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    bio: { type: String, required: true },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
        required: true,
      },
    },

    token: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) next();
//   this.password = await hash(this.password, 10);
// });
export const User = model("User", userSchema);
