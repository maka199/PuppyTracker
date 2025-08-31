import type { Express, RequestHandler } from "express";

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
      };
    }
  }
}

// Simple username validation middleware
export const validateUsername: RequestHandler = (req, res, next) => {
  // Get username from header or POST body
  const username = req.headers['x-username'] || req.body?.username;
  
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(401).json({ message: "Username required" });
  }
  
  // Add sanitized username to request for downstream use
  req.user = { username: username.trim() };
  next();
};

// Simple setup for username-based auth (no complex session management needed)
export async function setupSimpleAuth(app: Express) {
  // Simple login endpoint that just validates username
  app.post('/api/login', (req, res) => {
    const { username } = req.body;
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ message: "Username is required" });
    }
    
    res.json({ 
      success: true, 
      username: username.trim(),
      message: "Login successful" 
    });
  });

  // Simple logout endpoint 
  app.post('/api/logout', (req, res) => {
    res.json({ success: true, message: "Logout successful" });
  });
}