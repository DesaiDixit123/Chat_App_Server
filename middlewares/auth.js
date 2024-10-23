import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { corsOption, USER_TOKEN } from "../constants/config.js";
import dotenv from "dotenv";
import cookie from "cookie"; 

dotenv.config();
// export const isAuthenticated = async (req, res,next) => {
//     try {
//         const token = req.cookies.userCookie
//         // console.log(token)

//         if (!token) throw new Error("Please login to access this route")

//         const verifyToken = jwt.verify(token, process.env.JWT_SECRET)
//         if(!verifyToken) throw new Error("Token is invalid.")

//             console.log(verifyToken._id)

//             req.verifyTokenId=verifyToken
//             next()
//     } catch (error) {

//         res.status(400).send({
//             process: false,
//             message:error.message
//         })

//     }
// }

// // export const verifyUser

// import jwt from "jsonwebtoken";

// export const isAuthenticated = async (req, res, next) => {
//     try {
//         const token = req.cookies.userCookie;

//         if (!token) throw new Error("Please login to access this route");

//         // req.verifyTokenId = verifyToken.id;
//         // next();
//     } catch (error) {
//         res.status(400).send({
//             process: false,
//             message: error.message,
//         });
//     }
// };

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.userCookie;

    if (!token) throw new Error("Please login to access this route");

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!verifyToken) throw new Error("Token is invalid.");

    const user = await User.findById(verifyToken._id);
    if (!user) throw new Error("User not found.");

    req.user = user;

    next();
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

export const isAdminAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.admintoken;

    if (!token) throw new Error("Only admin can access this route");

    console.log("token:", token);
    const secretKey = jwt.verify(token, process.env.JWT_SECRET);

    const adminSecretKey = process.env.ADMIN_SECRET_KEY || "ChatAppByDefault";

    const isMatched = secretKey === adminSecretKey;

    if (!isMatched) throw new Error("Only admin can access this route");
    next();
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};

// export const socketAuthentication = async (req,res, socket, next) => {
//   try {
//     if (socket.error) throw new Error("Socket Authentication Failed.")

//     const authToken = socket.request.cookies["userCookie"];

//     if (!authToken) throw new Error("Please login to access this route.");

//     const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);
//     const user = await User.findById(decodedData._id);

//     if (!user) throw new Error("Please login to access this route.");
//     socket.user = user;

//     return next();
//   } catch (error) {
//     console.log(error);
//     // res.status(201).send({
//     //   process: false,
//     //   message: "Please login to access this route",
//     // });
//   }
// };



// export const socketAuthentication = (socket, next) => {
//   const token = socket.handshake.auth.token; // Read the token from the handshake auth
//   if (!token) {
//     return next(new Error('No token provided'));
//   }

//   try {
//     // Verify the token (JWT or another method)
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     socket.user = decoded; // Attach user data to socket
//     next();
//   } catch (err) {
//     return next(new Error('Authentication failed'));
//   }
// };




export const socketAuthenticator =async (err,socket,next) => {
  try {
    if(err) return next(new Error("Please Login To Access This Route"))

    const authToken = socket.request.cookies.userCookie
    if (!authToken) return next(new Error("Please Login To Access This Route"))
    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET)
    const user = await User.findById(decodedData._id)
    if (!user) return next(new Error("Please Login To Access This Route"))
    
    socket.user = user
    
    return next()
  } catch (error) {

    console.log(error)

    return next(new Error("Please Login To Access This Route"))
    
  }
  
}
