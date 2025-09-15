import {
  users,
  walks,
  walkEvents,
  feedings,
  dogs,
  type User,
  type UpsertUser,
  type Walk,
  type InsertWalk,
  type WalkEvent,
  type InsertWalkEvent,
  type Feeding,
  type InsertFeeding,
  type Dog,
  type InsertDog,
  type WalkWithEvents,
  type FeedingWithUser,
  type ActivityItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Walk operations
  createWalk(walk: InsertWalk): Promise<Walk>;
  updateWalk(id: string, updates: Partial<Walk>): Promise<Walk>;
  getWalk(id: string): Promise<WalkWithEvents | undefined>;
  getUserWalks(userId: string, limit?: number): Promise<WalkWithEvents[]>;
  getActiveWalk(userId: string): Promise<WalkWithEvents | undefined>;
  
  // Walk event operations
  createWalkEvent(event: InsertWalkEvent): Promise<WalkEvent>;
  getWalkEvents(walkId: string): Promise<WalkEvent[]>;
  
  // Feeding operations
  createFeeding(feeding: InsertFeeding): Promise<Feeding>;
  getUserFeedings(userId: string, limit?: number): Promise<FeedingWithUser[]>;
  getLastFeeding(): Promise<FeedingWithUser | undefined>;
  
  // Activity operations
  getRecentActivity(limit?: number): Promise<ActivityItem[]>;
  getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<ActivityItem[]>;
  
  // Dog operations
  createDog(dog: InsertDog): Promise<Dog>;
  updateDog(id: string, updates: Partial<Dog>): Promise<Dog>;
  getDog(id: string): Promise<Dog | undefined>;
  getUserDog(userId: string): Promise<Dog | undefined>;
}

export class DatabaseStorage implements IStorage {
  async updateFeeding(id: string, updates: Partial<Feeding>): Promise<Feeding> {
    if (updates.timestamp) {
      updates.timestamp = new Date(updates.timestamp);
    }
    const [updatedFeeding] = await db
      .update(feedings)
      .set(updates)
      .where(eq(feedings.id, id))
      .returning();
    return updatedFeeding;
  }
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Walk operations
  async createWalk(walk: InsertWalk): Promise<Walk> {
    const [newWalk] = await db.insert(walks).values(walk).returning();
    return newWalk;
  }

  async updateWalk(id: string, updates: Partial<Walk>): Promise<Walk> {
    const [updatedWalk] = await db
      .update(walks)
      .set(updates)
      .where(eq(walks.id, id))
      .returning();
    return updatedWalk;
  }

  async getWalk(id: string): Promise<WalkWithEvents | undefined> {
    const walkData = await db
      .select()
      .from(walks)
      .leftJoin(users, eq(walks.userId, users.id))
      .leftJoin(walkEvents, eq(walks.id, walkEvents.walkId))
      .where(eq(walks.id, id));

    if (walkData.length === 0) return undefined;

    const walk = walkData[0].walks;
    const user = walkData[0].users!;
    const events = walkData
      .filter(row => row.walk_events)
      .map(row => row.walk_events!);

    return { ...walk, user, events };
  }

  async getUserWalks(userId: string, limit = 10): Promise<WalkWithEvents[]> {
    const walkData = await db
      .select()
      .from(walks)
      .leftJoin(users, eq(walks.userId, users.id))
      .leftJoin(walkEvents, eq(walks.id, walkEvents.walkId))
      .where(eq(walks.userId, userId))
      .orderBy(desc(walks.startTime))
      .limit(limit * 10); // Get more rows to account for joins

    const walksMap = new Map<string, WalkWithEvents>();

    walkData.forEach(row => {
      const walk = row.walks;
      const user = row.users!;
      const event = row.walk_events;

      if (!walksMap.has(walk.id)) {
        walksMap.set(walk.id, { ...walk, user, events: [] });
      }

      if (event) {
        walksMap.get(walk.id)!.events.push(event);
      }
    });

    return Array.from(walksMap.values()).slice(0, limit);
  }

  async getActiveWalk(userId: string): Promise<WalkWithEvents | undefined> {
    const [activeWalk] = await db
      .select()
      .from(walks)
      .leftJoin(users, eq(walks.userId, users.id))
      .where(and(eq(walks.userId, userId), eq(walks.isCompleted, false)))
      .orderBy(desc(walks.startTime))
      .limit(1);

    if (!activeWalk) return undefined;

    const events = await db
      .select()
      .from(walkEvents)
      .where(eq(walkEvents.walkId, activeWalk.walks.id));

    return {
      ...activeWalk.walks,
      user: activeWalk.users!,
      events,
    };
  }

  // Walk event operations
  async createWalkEvent(event: InsertWalkEvent): Promise<WalkEvent> {
    const [newEvent] = await db.insert(walkEvents).values(event).returning();
    return newEvent;
  }

  async getWalkEvents(walkId: string): Promise<WalkEvent[]> {
    return await db
      .select()
      .from(walkEvents)
      .where(eq(walkEvents.walkId, walkId))
      .orderBy(walkEvents.timestamp);
  }

  // Feeding operations
  async createFeeding(feeding: InsertFeeding): Promise<Feeding> {
    const [newFeeding] = await db.insert(feedings).values(feeding).returning();
    return newFeeding;
  }

  async getUserFeedings(userId: string, limit = 10): Promise<FeedingWithUser[]> {
    const feedingData = await db
      .select()
      .from(feedings)
      .leftJoin(users, eq(feedings.userId, users.id))
      .where(eq(feedings.userId, userId))
      .orderBy(desc(feedings.timestamp))
      .limit(limit);

    return feedingData.map(row => ({
      ...row.feedings,
      user: row.users!,
    }));
  }

  async getLastFeeding(): Promise<FeedingWithUser | undefined> {
    const [lastFeeding] = await db
      .select()
      .from(feedings)
      .leftJoin(users, eq(feedings.userId, users.id))
      .orderBy(desc(feedings.timestamp))
      .limit(1);

    if (!lastFeeding) return undefined;

    return {
      ...lastFeeding.feedings,
      user: lastFeeding.users!,
    };
  }

  // Activity operations
  async getRecentActivity(limit = 20): Promise<ActivityItem[]> {
    const recentWalks = await db
      .select()
      .from(walks)
      .leftJoin(users, eq(walks.userId, users.id))
      .leftJoin(walkEvents, eq(walks.id, walkEvents.walkId))
      .where(eq(walks.isCompleted, true))
      .orderBy(desc(walks.startTime))
      .limit(limit);

    const recentFeedings = await db
      .select()
      .from(feedings)
      .leftJoin(users, eq(feedings.userId, users.id))
      .orderBy(desc(feedings.timestamp))
      .limit(limit);

    // Process walks
    const walksMap = new Map<string, ActivityItem>();
    recentWalks.forEach(row => {
      const walk = row.walks;
      const user = row.users!;
      const event = row.walk_events;

      if (!walksMap.has(walk.id)) {
        walksMap.set(walk.id, {
          id: walk.id,
          type: 'walk',
          timestamp: walk.startTime,
          user,
          data: walk,
          events: [],
        });
      }

      if (event) {
        walksMap.get(walk.id)!.events!.push(event);
      }
    });

    // Process feedings
    const feedingActivities: ActivityItem[] = recentFeedings.map(row => ({
      id: row.feedings.id,
      type: 'feeding',
      timestamp: row.feedings.timestamp,
      user: row.users!,
      data: row.feedings,
    }));

    // Combine and sort by timestamp
    const allActivities = [
      ...Array.from(walksMap.values()),
      ...feedingActivities,
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return allActivities.slice(0, limit);
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<ActivityItem[]> {
    const walkData = await db
      .select()
      .from(walks)
      .leftJoin(users, eq(walks.userId, users.id))
      .leftJoin(walkEvents, eq(walks.id, walkEvents.walkId))
      .where(and(
        eq(walks.isCompleted, true),
        gte(walks.startTime, startDate),
        lte(walks.startTime, endDate)
      ))
      .orderBy(desc(walks.startTime));

    const feedingsData = await db
      .select()
      .from(feedings)
      .leftJoin(users, eq(feedings.userId, users.id))
      .where(and(
        gte(feedings.timestamp, startDate),
        lte(feedings.timestamp, endDate)
      ))
      .orderBy(desc(feedings.timestamp));

    // Process similar to getRecentActivity
    const walksMap = new Map<string, ActivityItem>();
    walkData.forEach((row: any) => {
      const walk = row.walks;
      const user = row.users!;
      const event = row.walk_events;

      if (!walksMap.has(walk.id)) {
        walksMap.set(walk.id, {
          id: walk.id,
          type: 'walk',
          timestamp: walk.startTime,
          user,
          data: walk,
          events: [],
        });
      }

      if (event) {
        walksMap.get(walk.id)!.events!.push(event);
      }
    });

    const feedingActivities: ActivityItem[] = feedingsData.map(row => ({
      id: row.feedings.id,
      type: 'feeding',
      timestamp: row.feedings.timestamp,
      user: row.users!,
      data: row.feedings,
    }));

    return [
      ...Array.from(walksMap.values()),
      ...feedingActivities,
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  // Dog operations
  async createDog(dogData: InsertDog): Promise<Dog> {
    const [dog] = await db
      .insert(dogs)
      .values(dogData)
      .returning();
    return dog;
  }

  async updateDog(id: string, updates: Partial<Dog>): Promise<Dog> {
    const [dog] = await db
      .update(dogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dogs.id, id))
      .returning();
    
    if (!dog) {
      throw new Error(`Dog with id ${id} not found`);
    }
    
    return dog;
  }

  async getDog(id: string): Promise<Dog | undefined> {
    const [dog] = await db.select().from(dogs).where(eq(dogs.id, id));
    return dog;
  }

  async getUserDog(userId: string): Promise<Dog | undefined> {
    const [dog] = await db
      .select()
      .from(dogs)
      .where(and(eq(dogs.userId, userId), eq(dogs.isActive, true)))
      .orderBy(desc(dogs.createdAt));
    return dog;
  }
}

export const storage = new DatabaseStorage();
