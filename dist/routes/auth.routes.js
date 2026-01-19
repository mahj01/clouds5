"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
router.get("/me", auth_controller_1.me);
router.post("/verify", auth_controller_1.verify);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map