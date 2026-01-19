"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyIdToken = verifyIdToken;
exports.getIdTokenFromAuthHeader = getIdTokenFromAuthHeader;
const firebase_1 = require("../firebase");
function extractBearerToken(authorizationHeader) {
    if (!authorizationHeader)
        return null;
    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    return match?.[1] ?? null;
}
async function verifyIdToken(idToken) {
    const admin = (0, firebase_1.getFirebaseAdmin)();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const user = { uid: decoded.uid };
    if (decoded.email)
        user.email = decoded.email;
    if (decoded.name)
        user.name = decoded.name;
    if (decoded.picture)
        user.picture = decoded.picture;
    return user;
}
function getIdTokenFromAuthHeader(authorizationHeader) {
    return extractBearerToken(authorizationHeader);
}
//# sourceMappingURL=auth.service.js.map