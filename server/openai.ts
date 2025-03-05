import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
export async function getChatResponse(messages: { role: string; content: string }[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",  // Fallback to gpt-4 as gpt-4o might not be available
      messages: [
        {
          role: "system",
          content: "You are a helpful travel agent assistant. Help users plan their trips, book flights and hotels, and give travel recommendations. Keep responses concise and focused on travel-related queries.",
        },
        ...messages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content
        })),
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I apologize, but I'm having trouble connecting to my AI service right now. Please try again later.";
  }
}