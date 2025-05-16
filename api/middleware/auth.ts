import jwt, { JwtPayload } from 'jsonwebtoken'
import { constants } from '../config/constants'
import { Request, Response, NextFunction } from 'express'
import { IAuthParams } from '../interfaces/types'

const { JWT_SECRET } = constants

export const context = async ({ req }: { req: Request }) => {
  const auth = req.cookies['auth'] ? JSON.parse(req.cookies['auth']) : ''
  const customReq = req as Request & IAuthParams

  if (!auth) {
    customReq.isAuthorized = false
    return customReq
  }

  let decodedToken

  try {
    decodedToken = jwt.verify(auth.token, JWT_SECRET)
  } catch (err) {
    customReq.isAuthorized = false
    return customReq
  }

  if (!decodedToken) {
    customReq.isAuthorized = false
    return customReq
  }

  customReq.isAuthorized = true
  customReq.userId = (decodedToken as JwtPayload).userId

  return customReq
}

// Middleware to verify JWT token for Express routes
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided'
    });
  }
  
  // Extract the token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Add user info to request
    (req as any).userId = decoded.userId;
    (req as any).username = decoded.username;
    
    // Proceed to the next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token'
    });
  }
};
