import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { User } from "@shared/schema";

// Custom request interface to extend Express Request with user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify JWT token (implement your JWT verification logic here)
    // const decoded = verifyToken(token);
    // req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  role: z.enum(['employer', 'job_seeker']).default('job_seeker'),
  companyName: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Create user in database
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(data.role === 'employer' && { companyName: data.companyName })
      });
      
      res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.', user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Authenticate user
      const { user, token } = await storage.loginUser(email, password, req);
      
      // Return user data and token
      res.json({ 
        message: 'Login successful', 
        user, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Generate reset token and send email
      const { resetToken } = await storage.requestPasswordReset(email);
      
      // In a real app, you would send an email with the reset link
      // For now, we'll just return the token for testing
      res.json({ 
        message: 'Password reset instructions sent to your email',
        // Remove this in production
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to process request' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      
      // Reset password
      await storage.resetPassword(token, newPassword);
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to reset password' });
    }
  });

  // Verify email
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Invalid verification token' });
      }
      
      // Verify email
      await storage.verifyEmail(token);
      
      // Redirect to login page with success message
      res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    } catch (error) {
      // Redirect to login page with error message
      res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error instanceof Error ? error.message : 'Verification failed')}`);
    }
  });

  // Protected route example
  app.get('/api/profile', isAuthenticated, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  return httpServer;
}
