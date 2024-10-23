// import { connect } from "mongoose";

// export const dbCon = async (conn) => {
//   await connect(conn);
//   console.log("Database connected...");
// };



import { connect } from "mongoose";

export const dbCon = async (conn) => {
  try {
    await connect(conn, {
    
      serverSelectionTimeoutMS: 50000, // Increase the timeout to 50 seconds
      connectTimeoutMS: 30000,        // Connection timeout
      socketTimeoutMS: 45000,         // Socket timeout
    });
    console.log("Database connected...");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};
