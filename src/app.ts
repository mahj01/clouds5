import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";

import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serves public/login.html at /login.html
app.use(express.static(path.resolve(process.cwd(), "public")));

app.get("/", (_req, res) => {
	res.redirect("/login.html");
});

app.use("/auth", authRoutes);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server running on http://localhost:${port}`);
});

export default app;
