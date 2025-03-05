// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  messages;
  bookings;
  messageId;
  bookingId;
  constructor() {
    this.messages = /* @__PURE__ */ new Map();
    this.bookings = /* @__PURE__ */ new Map();
    this.messageId = 1;
    this.bookingId = 1;
  }
  async getMessages() {
    return Array.from(this.messages.values());
  }
  async addMessage(message) {
    const id = this.messageId++;
    const newMessage = {
      id,
      ...message,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  async getBookings() {
    return Array.from(this.bookings.values());
  }
  async addBooking(booking) {
    const id = this.bookingId++;
    const newBooking = {
      id,
      ...booking
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});
var bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  // "flight" or "hotel"
  details: text("details").notNull(),
  // JSON string
  date: timestamp("date").notNull()
});
var insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true
});
var insertBookingSchema = createInsertSchema(bookings).pick({
  type: true,
  details: true,
  date: true
});
var mockFlights = [
  {
    id: "F1",
    from: "New York",
    to: "Paris",
    date: "2024-05-15",
    price: 650,
    airline: "SkyWings",
    duration: "7h 30m",
    image: "https://images.unsplash.com/photo-1591981813204-f5a433700b7b"
  },
  {
    id: "F2",
    from: "London",
    to: "Tokyo",
    date: "2024-05-20",
    price: 890,
    airline: "GlobalAir",
    duration: "11h 45m",
    image: "https://images.unsplash.com/photo-1592985684811-6c0f98adb014"
  }
];
var mockHotels = [
  {
    id: "H1",
    name: "Luxury Palace",
    location: "Paris",
    price: 250,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39"
  },
  {
    id: "H2",
    name: "Ocean View Resort",
    location: "Bali",
    price: 180,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
  },
  {
    id: "H3",
    name: "Mountain Lodge",
    location: "Swiss Alps",
    price: 320,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461"
  },
  {
    id: "H4",
    name: "City Central Hotel",
    location: "Tokyo",
    price: 210,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a"
  }
];
var mockDestinations = [
  {
    id: "D1",
    name: "Paris",
    description: "City of Love",
    image: "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a"
  },
  {
    id: "D2",
    name: "Santorini",
    description: "Greek Paradise",
    image: "https://images.unsplash.com/photo-1554366347-897a5113f6ab"
  },
  {
    id: "D3",
    name: "Bali",
    description: "Tropical Paradise",
    image: "https://images.unsplash.com/photo-1606944331341-72bf6523ff5e"
  },
  {
    id: "D4",
    name: "Swiss Alps",
    description: "Mountain Wonder",
    image: "https://images.unsplash.com/photo-1594661745200-810105bcf054"
  },
  {
    id: "D5",
    name: "Tokyo",
    description: "Modern Marvel",
    image: "https://images.unsplash.com/photo-1484910292437-025e5d13ce87"
  },
  {
    id: "D6",
    name: "New York",
    description: "City That Never Sleeps",
    image: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd"
  }
];

// server/openai.ts
import OpenAI from "openai";
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}
var openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function getChatResponse(messages2) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      // Fallback to gpt-4 as gpt-4o might not be available
      messages: [
        {
          role: "system",
          content: "You are a helpful travel agent assistant. Help users plan their trips, book flights and hotels, and give travel recommendations. Keep responses concise and focused on travel-related queries."
        },
        ...messages2.map((m) => ({
          role: m.role,
          content: m.content
        }))
      ],
      temperature: 0.7
    });
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I apologize, but I'm having trouble connecting to my AI service right now. Please try again later.";
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/messages", async (req, res) => {
    const messages2 = await storage.getMessages();
    res.json(messages2);
  });
  app2.post("/api/messages", async (req, res) => {
    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid message format" });
    }
    const message = await storage.addMessage(result.data);
    if (result.data.role === "user") {
      const messages2 = await storage.getMessages();
      const aiResponse = await getChatResponse(
        messages2.map((m) => ({ role: m.role, content: m.content }))
      );
      const aiMessage = await storage.addMessage({
        role: "assistant",
        content: aiResponse
      });
      return res.json([message, aiMessage]);
    }
    res.json(message);
  });
  app2.get("/api/bookings", async (req, res) => {
    const bookings2 = await storage.getBookings();
    res.json(bookings2);
  });
  app2.post("/api/bookings", async (req, res) => {
    const result = insertBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid booking format" });
    }
    const booking = await storage.addBooking(result.data);
    res.json(booking);
  });
  app2.get("/api/flights", (req, res) => {
    res.json(mockFlights);
  });
  app2.get("/api/hotels", (req, res) => {
    res.json(mockHotels);
  });
  app2.get("/api/destinations", (req, res) => {
    res.json(mockDestinations);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
