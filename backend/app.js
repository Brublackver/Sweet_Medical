import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import router from "./routes/router.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(router);
app.use(errorHandler);

export default app;
