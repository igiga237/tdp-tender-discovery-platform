import {Request, Response, NextFunction } from 'express';


// Extend Express Request type
declare global {
    namespace Express {
      interface Request {
        user?: { id: string };
      }
    }
}


export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === "development") {
      req.user = { id: "1" }; // Hardcoded user for development
      return next();
    }
  
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

};