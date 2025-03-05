import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "flight" or "hotel"
  details: text("details").notNull(), // JSON string
  date: timestamp("date").notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  type: true,
  details: true,
  date: true,
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export const mockFlights = [
  {
    id: "F1",
    from: "New York",
    to: "Paris",
    date: "2024-05-15",
    price: 650,
    airline: "SkyWings",
    duration: "7h 30m",
    image: "https://images.unsplash.com/photo-1591981813204-f5a433700b7b",
  },
  {
    id: "F2",
    from: "London",
    to: "Tokyo",
    date: "2024-05-20",
    price: 890,
    airline: "GlobalAir",
    duration: "11h 45m",
    image: "https://images.unsplash.com/photo-1592985684811-6c0f98adb014",
  },
];

export const mockHotels = [
  {
    id: "H1",
    name: "Luxury Palace",
    location: "Paris",
    price: 250,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39",
  },
  {
    id: "H2",
    name: "Ocean View Resort",
    location: "Bali",
    price: 180,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  },
  {
    id: "H3",
    name: "Mountain Lodge",
    location: "Swiss Alps",
    price: 320,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461",
  },
  {
    id: "H4",
    name: "City Central Hotel",
    location: "Tokyo",
    price: 210,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
  },
];

export const mockDestinations = [
  {
    id: "D1",
    name: "Paris",
    description: "City of Love",
    image: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a",
  },
  {
    id: "D2",
    name: "Santorini",
    description: "Greek Paradise",
    image: "https://images.unsplash.com/photo-1554366347-897a5113f6ab",
  },
  {
    id: "D3",
    name: "Bali",
    description: "Tropical Paradise",
    image: "https://images.unsplash.com/photo-1606944331341-72bf6523ff5e",
  },
  {
    id: "D4",
    name: "Swiss Alps",
    description: "Mountain Wonder",
    image: "https://images.unsplash.com/photo-1594661745200-810105bcf054",
  },
  {
    id: "D5",
    name: "Tokyo",
    description: "Modern Marvel",
    image: "https://images.unsplash.com/photo-1484910292437-025e5d13ce87",
  },
  {
    id: "D6",
    name: "New York",
    description: "City That Never Sleeps",
    image: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd",
  },
];
