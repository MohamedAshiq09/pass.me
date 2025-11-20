import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    wallet_address: string;
    [key: string]: any;
  };
}

/**
 * JWT Authentication middleware
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      message: 'Please provide a valid access token',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
    
    logger.debug('Token authenticated', {
      wallet_address: decoded.wallet_address,
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.warn('Invalid token attempt', {
      token: token.substring(0, 20) + '...',
      ip: req.ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'The provided token is invalid or expired',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't require it
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
  } catch (error) {
    // Ignore invalid tokens in optional auth
    logger.debug('Optional auth failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  next();
};

/**
 * Wallet ownership verification middleware
 */
export const verifyWalletOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { wallet_address } = req.params;
  const userWallet = req.user?.wallet_address;

  if (!userWallet) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please authenticate to access this resource',
    });
  }

  if (wallet_address && wallet_address !== userWallet) {
    logger.warn('Wallet ownership verification failed', {
      requestedWallet: wallet_address,
      userWallet,
      ip: req.ip,
    });

    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'You can only access your own wallet resources',
    });
  }

  next();
};

export default {
  authenticateToken,
  optionalAuth,
  verifyWalletOwnership,
};