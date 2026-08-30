import { Router } from 'express';
import { authRateLimiter } from '../../gateway/rateLimiter';
import { authMiddleware } from '../../gateway/authMiddleware';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/verify-otp', authRateLimiter, authController.verifyOtp);
router.post('/resend-otp', authRateLimiter, authController.resendOtpHandler);
router.post('/refresh', authController.refreshToken);
router.get('/me', authMiddleware, authController.me);

export default router;
