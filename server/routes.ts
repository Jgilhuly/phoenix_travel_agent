import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertBookingSchema, mockFlights, mockHotels, mockDestinations } from "@shared/schema";
import { getChatResponse } from "./openai";

export async function registerRoutes(app: Express) {
  app.get("/api/messages", async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid message format" });
    }

    const message = await storage.addMessage(result.data);
    
    if (result.data.role === "user") {
      const messages = await storage.getMessages();
      const aiResponse = await getChatResponse(
        messages.map(m => ({ role: m.role, content: m.content }))
      );
      const aiMessage = await storage.addMessage({
        role: "assistant",
        content: aiResponse,
      });
      return res.json([message, aiMessage]);
    }

    res.json(message);
  });

  app.get("/api/bookings", async (req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.post("/api/bookings", async (req, res) => {
    const result = insertBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid booking format" });
    }

    const booking = await storage.addBooking(result.data);
    res.json(booking);
  });

  app.get("/api/flights", (req, res) => {
    res.json(mockFlights);
  });

  app.get("/api/hotels", (req, res) => {
    res.json(mockHotels);
  });

  app.get("/api/destinations", (req, res) => {
    res.json(mockDestinations);
  });

  const httpServer = createServer(app);
  return httpServer;
}
