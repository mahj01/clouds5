"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = me;
exports.verify = verify;
const auth_service_1 = require("../services/auth.service");
async function me(req, res) {
    try {
        const idToken = (0, auth_service_1.getIdTokenFromAuthHeader)(req.header("authorization"));
        if (!idToken) {
            return res.status(401).json({ error: "Missing Bearer token" });
        }
        const user = await (0, auth_service_1.verifyIdToken)(idToken);
        return res.json({ user });
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
async function verify(req, res) {
    try {
        const idToken = req.body?.idToken ?? undefined;
        if (!idToken) {
            return res.status(400).json({ error: "Missing idToken in body" });
        }
        const user = await (0, auth_service_1.verifyIdToken)(idToken);
        return res.json({ user });
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
//# sourceMappingURL=auth.controller.js.map