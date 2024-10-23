import { body, validationResult, check, param, query } from "express-validator";

export const registerValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
  body("bio", "Please Enter Bio").notEmpty(),
  body("confirmPassword", "Please Enter Confirm Password").notEmpty(),

];
export const loginValidator = () => [
  body("username", "Please Enter Username").notEmpty(),
  body("password", "Please Enter Password").notEmpty(),
];
export const newGroupValidator = () => [
  body("name", "Please Enter Name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members.")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be 2-100"),
];
export const addMemberValidator = () => [
  body("chatId", "Please Enter Chat Id").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter Members.")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be 1-97"),
];
export const removeMemberValidator = () => [
  body("userId", "Please Enter User Id").notEmpty(),
  body("chatId", "Please Enter Chat Id").notEmpty(),
];

export const sendAttachmentValidator = () => [
  body("chatId", "Please Enter Chat Id").notEmpty(),
 
];
export const chatIdValidator = () => [
  param("id", "Please Enter Chat Id").notEmpty(),
];
export const renameChatValidator = () => [
  param("id", "Please Enter Chat Id").notEmpty(),
  body("name", "Please Enter New Group Name").notEmpty(),
];
export const sendRequestValidator = () => [
  body("userId", "Please Enter User Id").notEmpty(),
];
export const acceptRequestValidator = () => [
  body("requestId", "Please Enter Request Id").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please Add Accept")
    .isBoolean()
    .withMessage("Accept must be a boolean."),
];
export const adminLoginValidator = () => [
  body("secretKey", "Please Enter Secret Key").notEmpty(),
 
];

export const validateHandeler = (req, res, next) => {
  try {
    const errors = validationResult(req);
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    console.log(errorMessages);
    if (errors.isEmpty()) return next();
    else throw new Error(errorMessages);
  } catch (error) {
    res.status(400).send({
      process: false,
      message: error.message,
    });
  }
};
