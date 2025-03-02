import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";


dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// In-memory store for failed login attempts
const failedLogins: { [email: string]: { count: number; lockUntil?: number } } =
  {};

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// JWT Secret & Expiration
const JWT_SECRET = process.env.JWT_SECRET || "your_secret";
const JWT_EXPIRATION = "1h";

// Middleware to enforce rate limits (basic protection)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit to 10 requests per minute per IP
  message: "Too many login attempts. Try again later.",
});

// Login Handler
app.post("/api/v1/auth/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Check if the user is locked out
  const userLockout = failedLogins[email];
  if (userLockout && userLockout.lockUntil && Date.now() < userLockout.lockUntil) {
    return res
      .status(403)
      .json({ error: "Too many failed login attempts. Try again later." });
  }

  // Authenticate user with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Track failed login attempts
    if (!failedLogins[email]) {
      failedLogins[email] = { count: 1 };
    } else {
      failedLogins[email].count += 1;
    }

    // Lock account after 5 failed attempts
    if (failedLogins[email].count >= 5) {
      failedLogins[email].lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes

      // Send notification email
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Suspicious Login Activity Detected",
        text: `We've detected multiple failed login attempts to your account. If this wasn't you, please reset your password immediately.`,
      });
    }

    return res.status(401).json({ error: "Invalid credentials." });
  }

  // Reset failed login attempts on success
  delete failedLogins[email];

  // Generate JWT
  const token = jwt.sign({ userId: data.user?.id, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });

  res.json({
    message: "Login successful",
    token,
    redirect: "/dashboard", // Redirect user to dashboard
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
