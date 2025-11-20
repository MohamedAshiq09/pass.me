import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Verify wallet signature
router.post('/verify', authLimiter, authController.verifyWallet);

// Get user profile
router.get('/profile/:wallet_address', authController.getProfile);

// Update user profile
router.put('/profile/:wallet_address', authController.updateProfile);

export default router;