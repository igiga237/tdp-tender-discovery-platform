// apps/backend/src/services/userServices.ts
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Type definitions
interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPass: string;
}

function matchPass(password: string): boolean {
  const pass = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  return pass.test(password);
}

/**
 * signupUser
 * Uses Supabase admin API to ensure user doesn't exist, then calls supabase.auth.signUp
 */
export async function signupUser({
  name,
  email,
  password,
  confirmPass,
}: SignupInput): Promise<User | null> {
  // 1. Validate required fields.
  if (!name || !email || !password || !confirmPass) {
    throw new Error('Name, Email, Password, and Confirm Password are required.');
  }

  // 2. Validate password match.
  if (password !== confirmPass) {
    throw new Error('The Password and Confirm Password fields do not match.');
  }

  // 3. Validate password strength.
  if (!matchPass(password)) {
    throw new Error(
      'Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.'
    );
  }

  // 4. Check if user already exists using Supabase admin API.
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({});
  if (listError) {
    throw new Error(listError.message);
  }

  if (userList && userList.users && userList.users.length > 0) {
    // Look for a confirmed user with a matching email (case-insensitive).
    const existingUser = userList.users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.confirmed_at
    );
    if (existingUser) {
      throw new Error('User already exists.');
    }
  }

  // 5. Proceed with Supabase sign up.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: name },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Return the newly created user object.
  return data.user;
}

interface ResetPasswordInput {
  newPassword: string;
  refreshToken: string;
}

export async function resetPassword(
  { newPassword, refreshToken }: ResetPasswordInput,
  authHeader?: string
): Promise<void> {
  // 1. Validate required fields
  if (!newPassword) {
    throw new Error('New password is required.');
  }
  if (!refreshToken) {
    throw new Error('Refresh token is missing.');
  }
  if (!authHeader) {
    throw new Error('Authorization header is required.');
  }

  // 2. Extract token from the authorization header
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token is missing.');
  }

  // 3. Set the session with Supabase
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: refreshToken,
  });
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  // 4. Update the user's password
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}

// Track failed logins in-memory
const failedLogins: Record<string, { count: number; lockUntil?: number }> = {};

interface LoginResult {
  filteredUser: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  token: string;
}

/**
 * loginUser
 * Signs in with Supabase, then creates a custom Node JWT using JWT_SECRET
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  // 1. Validate required fields.
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  // 2. Check if the user is locked out.
  const userLockout = failedLogins[email];
  if (userLockout && userLockout.lockUntil && Date.now() < userLockout.lockUntil) {
    throw new Error('Too many failed login attempts. Try again later.');
  }

  // 3. Attempt to sign in using Supabase.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log(">>>>>Data from Supabase signInWithPassword:", data);

  if (error) {
    // Increment failed login attempts.
    if (!failedLogins[email]) {
      failedLogins[email] = { count: 1 };
    } else {
      failedLogins[email].count += 1;
    }

    // Lock out after 5 failed attempts.
    if (failedLogins[email].count >= 5) {
      failedLogins[email].lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes

      // Send an email notification about suspicious activity.
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Suspicious Login Activity Detected',
        text: `We've detected multiple failed login attempts to your account. If this wasn't you, please reset your password immediately.`,
      });
    }
    throw new Error('Invalid credentials.');
  }

  // 4. Clear failed login record upon successful login.
  delete failedLogins[email];

  const user = data.user;
  if (!user) {
    throw new Error('User not found after login.');
  }

  // 5. Generate a JWT token with your Node secret
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.first_name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  // 6. Filter the user object to return only the required fields.
  const filteredUser = {
    id: user.id,
    email: user.email || '',
    role: user.role || '',
    name: user.user_metadata?.first_name || '',
  };

  // Debug: confirm we return the correct Node JWT, not the Supabase session
  console.log("loginUser => returning custom token:", { filteredUser, token });

  return { filteredUser, token };
}

interface ForgotPasswordInput {
  email: string;
}

/**
 * forgotPassword
 * Calls supabase.auth.resetPasswordForEmail with a redirect
 */
export async function forgotPassword({ email }: ForgotPasswordInput): Promise<void> {
  // Validate required field.
  if (!email) {
    throw { status: 400, message: 'Email is required.' };
  }

  // Call Supabase to send a reset password email.
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:4200/forgot-reset-password',
  });

  if (error) {
    throw { status: 400, message: error.message };
  }
}

