export const corsOption={
    origin: [
      "http://localhost:5173",
      "https://chat-app-server-1-pwau.onrender.com",
      process.env.CLIENT_URL,
    ],
    method:["GET","POST","PUT","DELETE"],
    credentials: true,
}
  
export const USER_TOKEN="userCookie"