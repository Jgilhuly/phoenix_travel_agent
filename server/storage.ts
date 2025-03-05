import { Message, InsertMessage, Booking, InsertBooking } from "@shared/schema";

export interface IStorage {
  getMessages(): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  getBookings(): Promise<Booking[]>;
  addBooking(booking: InsertBooking): Promise<Booking>;
}

export class MemStorage implements IStorage {
  private messages: Map<number, Message>;
  private bookings: Map<number, Booking>;
  private messageId: number;
  private bookingId: number;

  constructor() {
    this.messages = new Map();
    this.bookings = new Map();
    this.messageId = 1;
    this.bookingId = 1;
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async addMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      id,
      ...message,
      timestamp: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async addBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.bookingId++;
    const newBooking: Booking = {
      id,
      ...booking,
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }
}

export const storage = new MemStorage();
