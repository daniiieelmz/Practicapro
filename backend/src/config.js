import dotenv from "dotenv";

//Ejecutar la libreria dotenv
// para acceder al archivo .env
dotenv.config();

export const config = {
  db: {
    URI: process.env.DB_URI || "mongodb://localhost:27017/ZGasDB",
  },
  server: {
    port: process.env.PORT || 4000,
  },
  JWT: {
    secret: process.env.JWT_SECRET || "sdfsdf",
    expireIn: process.env.JWT_EXPIRES1 || "30d"
  }
};
