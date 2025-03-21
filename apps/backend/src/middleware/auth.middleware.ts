import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabaseClient';
import jwt from 'jsonwebtoken';

const white_list = [
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/forgotpassword',
  '/api/v1/auth/resetpassword',
  '/api/v1/auth/callback',
  '/'
];

declare module 'express' {
  export interface Request {
    token?: string;
    user?: {
      email: string;
      name: string;
    };
  }
}



export const auth = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  // Check if the request URL is in the whitelist
  if (white_list.some(item => req.originalUrl === item)) {
    return next();
  }

  // Check if authorization header exists and extract the token
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')?.[1];

  if (!token) {
    return res.status(401).json({
      message: 'Authorization token is required',
    });
  }

  try {
    // Check if the token is in JWT format (it should have 3 parts when split by '.')
    if (token.split('.').length === 3) {
      // Attempt to verify with your custom JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = {
        email: (decoded as any).email,
        name: (decoded as any).name,
      };
      return next();
    } else {
      // Otherwise, fall back to verifying with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        throw new Error(error?.message || 'Invalid user');
      }
      console.log("Is the user returend", req.user)
      req.user = {
        name: user.user_metadata?.first_name || '',
        email: user.email ?? '',
      };
      return next();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      message: 'Invalid or expired token',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

