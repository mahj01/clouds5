"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirebaseAdmin = getFirebaseAdmin;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let initialized = false;
function parseServiceAccountJson() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON.");
    }
}
function getFirebaseAdmin() {
    if (!initialized) {
        const serviceAccount = parseServiceAccountJson();
        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (serviceAccount) {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
                ...(projectId ? { projectId } : {}),
            });
        }
        else {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.applicationDefault(),
                ...(projectId ? { projectId } : {}),
            });
        }
        initialized = true;
    }
    return firebase_admin_1.default;
}
//# sourceMappingURL=firebase.js.map