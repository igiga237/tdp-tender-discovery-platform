// apps/backend/src/controllers/us-001/user_controller.ts
import { Request, Response } from 'express';
import { loginUser, googleLogin  } from '../../services/userServices';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
const userServices = require('../../services/userServices');
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { supabase } from '../../utils/supabaseClient';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function signupHandler(req: Request, res: Response) {
  try {
    const user = await userServices.signupUser(req.body);
    return res.status(201).json({
      message: 'Sign up completed successfully. Please check your email to verify your account.',
      user,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    await userServices.resetPassword(req.body, req.headers.authorization);
    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const { access_token, refresh_token, filteredUser } = await loginUser(email, password);
    return res.json({
      message: 'Login successful',
      access_token,
      refresh_token,
      user: filteredUser,
      redirect: '/',
    });
  } catch (err: any) {
    if (err.message === 'Too many failed login attempts. Try again later.') {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response): Promise<Response> {
  try {
    await userServices.forgotPassword(req.body);
    return res.status(200).json({
      message:
        'The Password reset email has been sent. Please check your email and follow the instructions to reset your password.',
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getAccount(req: Request, res: Response) {
  return res.json({ user: req.user });
}

export async function testEmail(req: Request, res: Response) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'viettien24.ottawa@gmail.com',
      subject: 'Test Email',
      text: 'If you received this, the email setup works!',
    });
    res.status(200).json({ message: 'Test email sent' });
  } catch (err: any) {
    console.error('Email error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function googleLoginHandler(req: Request, res: Response) {
  try {
    const url = await googleLogin();
    return res.status(200).json({ url });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleOAuthCallbackHandler = async (req: Request, res: Response) => {
  console.log('googleOAuthCallbackHandler triggered');
  try {
    const { credential } = req.body;
    console.log('Received credential:', credential);
    if (!credential) {
      console.error("No credential found in request body");
      return res.status(400).json({ message: 'Missing credential' });
    }
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('Verified payload:', payload);
    if (!payload) {
      console.error("Token verification failed, no payload found");
      return res.status(401).json({ message: 'Invalid Google token' });
    }
    const { email, name } = payload;
    if (!email) {
      console.error("Email not found in token payload:", payload);
      return res.status(400).json({ message: 'Email not found in Google token' });
    }


    // Generate your own JWT (set expiration as needed)
    const token = jwt.sign({email, name }, process.env.JWT_SECRET!, { expiresIn: '2h' });
    console.log('Generated JWT token successfully');
    
    return res.status(200).json({
      access_token: token,
      user: {
        email,
        name: name || email,
      },
    });

   
  } catch (error: any) {
    console.error("Google OAuth error:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
