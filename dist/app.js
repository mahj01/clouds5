"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serves public/login.html at /login.html
app.use(express_1.default.static(path_1.default.resolve(process.cwd(), "public")));
app.get("/", (_req, res) => {
    res.redirect("/login.html");
});
app.use("/auth", auth_routes_1.default);
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map