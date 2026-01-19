import { Router } from "express";
import { me, verify } from "../controllers/auth.controller";

const router = Router();

router.get("/me", me);
router.post("/verify", verify);

export default router;
