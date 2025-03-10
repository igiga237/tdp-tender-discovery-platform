// apps/backend/src/controllers/us-001/user_controller.ts
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { loginUser } from '../../services/userServices'; // Your custom loginUser function
import * as userServices from '../../services/userServices'; // If you prefer importing all as userServices

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
    // Forward the request body to the service
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
    // Pass body and authorization header to the service
    await userServices.resetPassword(req.body, req.headers.authorization);

    // If the service succeeds, respond with a 200 status
    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (err: any) {
    // If the service throws an error, catch it here
    return res.status(400).json({ error: err.message });
  }
}

/**
 * loginHandler
 * Calls userServices.loginUser (which signs in with Supabase) and then creates a custom Node JWT.
 * We return that custom JWT in the `token` field, *not* the Supabase session.
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // This calls Supabase signInWithPassword + creates a custom Node JWT
    const { filteredUser, token } = await loginUser(email, password);

    // Return your custom JWT (token), not the Supabase session
    return res.json({
      message: 'Login successful',
      user: filteredUser,
      token, // <-- The Node JWT from userServices
      redirect: '/',
    });
  } catch (err: any) {
    if (err.message === 'Too many failed login attempts. Try again later.') {
      return res.status(403).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

/**
 * forgotPasswordHandler
 * Forwards the request to userServices.forgotPassword, which calls supabase.auth.resetPasswordForEmail
 */
export async function forgotPasswordHandler(req: Request, res: Response): Promise<Response> {
  try {
    await userServices.forgotPassword(req.body);
    return res.status(200).json({
      message: 'The Password reset email has been sent. Please check your email and follow the instructions to reset your password.',
    });
  } catch (err: any) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * getAccount
 * Uses the auth middleware to decode the custom JWT. If valid, req.user is populated.
 */
export async function getAccount(req: Request, res: Response) {
  console.log("getAccount -> req.user:", req.user);
  // If req.user is undefined, the token was missing/invalid
  return res.json({ user: req.user });
}

/**
 * testEmail
 * Sends a test email using nodemailer + your configured transporter
 */
export async function testEmail(req: Request, res: Response) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'viettien24.ottawa@gmail.com', // Example email
      subject: 'Test Email',
      text: 'If you received this, the email setup works!',
    });
    res.status(200).json({ message: 'Test email sent' });
  } catch (err: any) {
    console.error('Email error:', err);
    res.status(500).json({ error: err.message });
  }
}

