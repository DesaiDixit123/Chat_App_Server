export const corsOption={
    origin: [
      "http://localhost:5173",
      "http://localhost:8000",
      process.env.CLIENT_URL,
    ],
    method:["GET","POST","PUT","DELETE"],
    credentials: true,
}
  
export const USER_TOKEN="userCookie"