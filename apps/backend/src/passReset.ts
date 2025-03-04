import express from 'express';
import pkg from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: '=' }));
app.use(express.json({ limit: '10mb' }));

const { Request, Response } = pkg;

// Loading Supabase URL and service key from environment variables
const supabaseURL = process.env.SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseURL || !supabaseKEY) {
  throw new Error('Missing Supabase URL or Service Key in environment variables.');
}
const supabaseClient = createClient(supabaseURL, supabaseKEY);

// Forgot Password API
// Sends pass reset email through supabase automatically
app.post('/api/v1/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Using the built in pass reset functionality of supabase
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: 'http://localhost:3000/reset-password'
  });
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.status(200).json({ message: 'The Password reset email has been sent. Please check your email and follow the insctructions to reset your Password.' });
});

// Reset Password API
app.post('/api/v1/auth/reset-password', async (req: Request, res: Response) => {
  const { newPassword, refreshToken } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required.' });
  }

  // Check for the refresh token in the request body.
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is missing.' });
  }

  // Expect the reset token (supplied by Supabase in the email link) in the Authorization header.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ error: 'Authorization header is required.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(400).json({ error: 'Token is missing.' });
  }

  // Set the session using both the access token and the refresh token.
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
    access_token: token,
    refresh_token: refreshToken
  });
  if (sessionError) {
    return res.status(400).json({ error: sessionError.message });
  }

  // Update the user's password using the active session.
  const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Password has been reset successfully.' });
});

app.get('/reset-password', (req, res) => {
  res.send('Placeholder: Please use Postman or a frontend to complete the password reset process.');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Password recovery server running on port ${PORT}`);
});
