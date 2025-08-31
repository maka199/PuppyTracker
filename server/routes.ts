import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, validateUsername } from "./simpleAuth";
import { insertWalkSchema, insertWalkEventSchema, insertFeedingSchema, insertDogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth setup
  await setupSimpleAuth(app);

  // User info route - returns the username for simple auth
  app.get('/api/auth/user', validateUsername, async (req: any, res) => {
    try {
      const username = req.user.username;
      // Return a simplified user object with username as the main identifier
      res.json({
        id: username, // Use username as ID for backwards compatibility  
        firstName: username,
        email: `${username}@local`, // Placeholder email for compatibility
        username: username
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Walk routes
  app.post('/api/walks', validateUsername, async (req: any, res) => {
    try {
      const username = req.user.username;
      const walkData = insertWalkSchema.parse({
        ...req.body,
        userId: username, // Use username as userId
        startTime: new Date(),
      });
      
      const walk = await storage.createWalk(walkData);
      res.json(walk);
    } catch (error) {
      console.error("Error creating walk:", error);
      res.status(400).json({ message: "Failed to create walk" });
    }
  });

  app.put('/api/walks/:id', validateUsername, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Convert endTime string to Date if present
      if (updates.endTime) {
        updates.endTime = new Date(updates.endTime);
      }
      
      const walk = await storage.updateWalk(id, updates);
      res.json(walk);
    } catch (error) {
      console.error("Error updating walk:", error);
      res.status(400).json({ message: "Failed to update walk" });
    }
  });

  app.get('/api/walks/active', validateUsername, async (req: any, res) => {
    try {
      const username = req.user.username;
      const activeWalk = await storage.getActiveWalk(username);
      res.json(activeWalk);
    } catch (error) {
      console.error("Error fetching active walk:", error);
      res.status(500).json({ message: "Failed to fetch active walk" });
    }
  });

  app.get('/api/walks/:id', validateUsername, async (req, res) => {
    try {
      const { id } = req.params;
      const walk = await storage.getWalk(id);
      if (!walk) {
        return res.status(404).json({ message: "Walk not found" });
      }
      res.json(walk);
    } catch (error) {
      console.error("Error fetching walk:", error);
      res.status(500).json({ message: "Failed to fetch walk" });
    }
  });

  // Walk event routes
  app.post('/api/walks/:walkId/events', validateUsername, async (req, res) => {
    try {
      const { walkId } = req.params;
      const eventData = insertWalkEventSchema.parse({
        ...req.body,
        walkId,
        timestamp: new Date(),
      });
      
      const event = await storage.createWalkEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating walk event:", error);
      res.status(400).json({ message: "Failed to create walk event" });
    }
  });

  // Feeding routes
  app.post('/api/feedings', validateUsername, async (req: any, res) => {
    try {
      const username = req.user.username;
      const feedingData = insertFeedingSchema.parse({
        ...req.body,
        userId: username, // Use username as userId
        timestamp: new Date(),
      });
      
      const feeding = await storage.createFeeding(feedingData);
      res.json(feeding);
    } catch (error) {
      console.error("Error creating feeding:", error);
      res.status(400).json({ message: "Failed to create feeding" });
    }
  });

  app.get('/api/feedings/last', async (req, res) => {
    try {
      const lastFeeding = await storage.getLastFeeding();
      res.json(lastFeeding);
    } catch (error) {
      console.error("Error fetching last feeding:", error);
      res.status(500).json({ message: "Failed to fetch last feeding" });
    }
  });

  // Activity routes
  app.get('/api/activity', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get('/api/activity/range', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const activities = await storage.getActivitiesByDateRange(start, end);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity by range:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Dog profile routes
  app.get('/api/dogs/profile', validateUsername, async (req: any, res) => {
    try {
      const username = req.user.username;
      const dog = await storage.getUserDog(username);
      res.json(dog);
    } catch (error) {
      console.error("Error fetching dog profile:", error);
      res.status(500).json({ message: "Failed to fetch dog profile" });
    }
  });

  app.post('/api/dogs', validateUsername, async (req: any, res) => {
    try {
      const username = req.user.username;
      const dogData = insertDogSchema.parse({
        ...req.body,
        userId: username, // Use username as userId
      });
      
      const dog = await storage.createDog(dogData);
      res.json(dog);
    } catch (error) {
      console.error("Error creating dog:", error);
      res.status(400).json({ message: "Failed to create dog" });
    }
  });

  app.put('/api/dogs/:id', validateUsername, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Verify the dog belongs to the current user
      const existingDog = await storage.getDog(id);
      if (!existingDog) {
        return res.status(404).json({ message: "Dog not found" });
      }
      
      const username = req.user.username;
      if (existingDog.userId !== username) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const dog = await storage.updateDog(id, updates);
      res.json(dog);
    } catch (error) {
      console.error("Error updating dog:", error);
      res.status(400).json({ message: "Failed to update dog" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
