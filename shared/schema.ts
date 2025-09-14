import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dog profiles table
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Skapare av profilen,
  name: varchar("name").notNull().default("Buddy"),
  breed: varchar("breed").default("Golden Retriever"),
  photoUrl: varchar("photo_url"),
  birthDate: timestamp("birth_date"),
  weight: integer("weight"), // in pounds
  inviteCode: varchar("invite_code").unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Kopplingstabell mellan användare och hundprofiler
export const dogMembers = pgTable("dog_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dogId: varchar("dog_id").notNull().references(() => dogs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("member"), // t.ex. 'owner', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Dog walks table
export const walks = pgTable("walks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Walk events (pee/poo stops)
export const walkEvents = pgTable("walk_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walkId: varchar("walk_id").notNull().references(() => walks.id),
  eventType: varchar("event_type").notNull(), // 'pee' or 'poo'
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feeding logs
export const feedings = pgTable("feedings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mealType: varchar("meal_type").notNull(), // 'breakfast', 'lunch', 'dinner'
  portion: varchar("portion").notNull(), // 'small', 'regular', 'large', 'treats'
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  walks: many(walks),
  feedings: many(feedings),
  dogs: many(dogs),
  dogMemberships: many(dogMembers),
}));

export const dogsRelations = relations(dogs, ({ one, many }) => ({
  user: one(users, {
    fields: [dogs.userId],
    references: [users.id],
  }),
  members: many(dogMembers),
}));

export const dogMembersRelations = relations(dogMembers, ({ one }) => ({
  dog: one(dogs, {
    fields: [dogMembers.dogId],
    references: [dogs.id],
  }),
  user: one(users, {
    fields: [dogMembers.userId],
    references: [users.id],
  }),
}));

export const walksRelations = relations(walks, ({ one, many }) => ({
  user: one(users, {
    fields: [walks.userId],
    references: [users.id],
  }),
  events: many(walkEvents),
}));

export const walkEventsRelations = relations(walkEvents, ({ one }) => ({
  walk: one(walks, {
    fields: [walkEvents.walkId],
    references: [walks.id],
  }),
}));

export const feedingsRelations = relations(feedings, ({ one }) => ({
  user: one(users, {
    fields: [feedings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertWalkSchema = createInsertSchema(walks).omit({
  id: true,
  createdAt: true,
});

export const insertWalkEventSchema = createInsertSchema(walkEvents).omit({
  id: true,
  createdAt: true,
});

export const insertFeedingSchema = createInsertSchema(feedings).omit({
  id: true,
  createdAt: true,
});

export const insertDogSchema = createInsertSchema(dogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDogMemberSchema = createInsertSchema(dogMembers).omit({
  id: true,
  joinedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Walk = typeof walks.$inferSelect;
export type InsertWalk = z.infer<typeof insertWalkSchema>;
export type WalkEvent = typeof walkEvents.$inferSelect;
export type InsertWalkEvent = z.infer<typeof insertWalkEventSchema>;
export type Feeding = typeof feedings.$inferSelect;
export type InsertFeeding = z.infer<typeof insertFeedingSchema>;
export type Dog = typeof dogs.$inferSelect;
export type InsertDog = z.infer<typeof insertDogSchema>;
export type DogMember = typeof dogMembers.$inferSelect;
export type InsertDogMember = z.infer<typeof insertDogMemberSchema>;

// Extended types for API responses
export type WalkWithEvents = Walk & {
  events: WalkEvent[];
  user: User;
};

export type FeedingWithUser = Feeding & {
  user: User;
};

export type ActivityItem = {
  id: string;
  type: 'walk' | 'feeding';
  timestamp: Date;
  user: User;
  data: Walk | Feeding;
  events?: WalkEvent[];
};
