import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { getBase64, getSockets } from "../lib/helper.js";
export const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
  // console.log("Emiting Event", event);
};

export const uploadFilesToCloadinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const results = await Promise.all(uploadPromises);
    const formatedResults = results.map((result) => ({
      public_id: result.public_id,
      url: result.url,
    }));

    return formatedResults;
  } catch (error) {
    throw new Error("Error uploading files to cloudinary", error);
  }
};
export const deleteFilesFromCloudinary = async (public_ids) => {};
