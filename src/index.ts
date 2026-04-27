import cookieParser from "cookie-parser";
import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth.routes";
import contentRouter from "./routes/content.routes";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files locally (fallback)
app.use("/uploads", express.static("uploads"));

// Health check
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ message: "health route is working" });
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/content", contentRouter);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});