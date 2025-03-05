
import gradio as gr
import os
import json

# Simple conversation history storage
class ConversationHistory:
    def __init__(self):
        self.messages = []
    
    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
    
    def get_history(self):
        return self.messages
    
    def clear(self):
        self.messages = []

# Travel agent chatbot class
class TravelAgentBot:
    def __init__(self):
        self.history = ConversationHistory()
        # Initialize with system message for travel agent persona
        self.history.add_message("system", "You are a helpful travel agent assistant. Help users plan trips, recommend destinations, and provide travel advice.")
    
    def respond(self, user_input):
        if not user_input.strip():
            return "Please enter a message."
        
        # Add user message to history
        self.history.add_message("user", user_input)
        
        # In a real application, you would call an LLM API here
        # For this skeleton, we'll just use mock responses
        travel_responses = [
            "I recommend visiting Paris in the spring. The weather is lovely and the crowds are smaller.",
            "Costa Rica is perfect for adventure travelers. You can zip-line through rainforests and relax on beautiful beaches.",
            "For your budget, I'd suggest Southeast Asia. Thailand and Vietnam offer amazing experiences at reasonable prices.",
            "A 7-day itinerary for Japan should include Tokyo, Kyoto, and perhaps a day trip to Mount Fuji.",
            "The best time to visit the Caribbean is between December and April, when you'll avoid hurricane season."
        ]
        
        import random
        response = random.choice(travel_responses)
        
        # Add assistant response to history
        self.history.add_message("assistant", response)
        
        return response
    
    def clear_history(self):
        self.history.clear()
        self.history.add_message("system", "You are a helpful travel agent assistant. Help users plan trips, recommend destinations, and provide travel advice.")
        return "Conversation history cleared."

# Initialize the bot
travel_bot = TravelAgentBot()

# Define the Gradio interface
def respond_to_user(message, history):
    bot_response = travel_bot.respond(message)
    return bot_response

def clear_chat_history():
    return travel_bot.clear_history()

# Create the Gradio interface
with gr.Blocks(css="footer {visibility: hidden}") as demo:
    gr.Markdown("# Travel Agent Chatbot")
    gr.Markdown("Ask me about destinations, travel tips, or help planning your next vacation!")
    
    chatbot = gr.Chatbot(
        [],
        elem_id="chatbot",
        avatar_images=(None, "https://img.icons8.com/color/96/000000/tourist-male--v1.png"),
    )
    
    with gr.Row():
        msg = gr.Textbox(
            placeholder="Where should I travel this summer?",
            container=False,
            scale=9,
        )
        submit = gr.Button("Send", scale=1)
    
    clear = gr.Button("Clear conversation")
    
    # Set up event handlers
    msg.submit(respond_to_user, [msg, chatbot], [msg, chatbot])
    submit.click(respond_to_user, [msg, chatbot], [msg, chatbot])
    clear.click(clear_chat_history, None, None)
    clear.click(lambda: [], None, chatbot)
    clear.click(lambda: "", None, msg)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
