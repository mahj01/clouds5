import type { FirebaseUser } from "../models/user.model";
export declare function verifyIdToken(idToken: string): Promise<FirebaseUser>;
export declare function getIdTokenFromAuthHeader(authorizationHeader: string | undefined): string | null;
//# sourceMappingURL=auth.service.d.ts.map