import json
import gradio as gr
import os
import openai
from openinference.instrumentation import using_session
import uuid
from instrument import setup_tracing
import prompts
import tools

openai.api_key = os.getenv("OPENAI_API_KEY")

tracer = setup_tracing()
session_id = str(uuid.uuid4())

class ConversationHistory:
    def __init__(self):
        self.messages = []
    
    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
    
    def get_history(self):
        return self.messages
    
    def add_messages(self, messages):
        self.messages.extend(messages)
    
    def clear(self):
        self.messages = []

class TravelAgentBot:
    def __init__(self):
        self.history = ConversationHistory()
    
    @tracer.tool(name="process_tool_call")
    def _process_tool_call(self, tool_call, messages):
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments)
        tool_result = getattr(tools, tool_name)(**tool_args)
        messages.append({"role": "tool", "content": tool_result, "tool_call_id": tool_call.id})
        return messages
    
    @tracer.chain(name="process_tool_calls")
    def process_tool_calls(self, response, messages):
        for tool_call in response.choices[0].message.tool_calls:
            messages = self._process_tool_call(tool_call, messages)
        return messages
    
    @tracer.chain(name="route_request")
    def get_openai_response(self, messages):
        
        router_prompt = prompts.get_prompt("travel-agent-router")
        formatted_prompt = router_prompt.format(variables={"question": messages[-1]["content"]})
        prompt_messages = messages + formatted_prompt.get('messages')
        
        # Remove any messages with content=None
        prompt_messages = [msg for msg in prompt_messages if msg.get("content") is not None]
        
        response = openai.chat.completions.create(
            messages=prompt_messages,
            **formatted_prompt.kwargs
        )
        
        messages.append({"role": response.choices[0].message.role, 
                         "content": response.choices[0].message.content})
        
        if response.choices[0].message.tool_calls:
            messages = self.process_tool_calls(response, messages)
            
        return messages
    
    @tracer.agent(name="invoke_agent")
    def respond(self, user_input):
        if not user_input.strip():
            return "Please enter a message."
        
        # Add user message to history
        self.history.add_message("user", user_input)
        
        messages = self.history.get_history()
        messages = self.get_openai_response(messages)
        
        # Get the assistant's response from the last message
        for msg in reversed(messages):
            if msg["role"] == "assistant" or msg["role"] == "tool":
                assistant_response = msg["content"]
                return assistant_response
        
        return "I'm processing your request."
    
    def clear_history(self):
        session_id = str(uuid.uuid4())
        self.history.clear()
        return "Conversation history cleared."

# Initialize the bot
travel_bot = TravelAgentBot()

# Define the Gradio interface
def respond_to_user(message, history):
    with using_session(session_id):
        bot_response = travel_bot.respond(message)
        return "", history + [[message, bot_response]]

def clear_chat_history():
    return travel_bot.clear_history()

# Create the Gradio interface
with gr.Blocks(css="footer {visibility: hidden}") as demo:
    gr.Markdown("# Travel Agent Chatbot")
    gr.Markdown("Ask me about destinations, travel tips, or help planning your next vacation!")
    
    chatbot = gr.Chatbot(
        [],
        elem_id="chatbot",
        avatar_images=(None, "https://img.icons8.com/color/96/000000/tourist-male--v1.png")
        # Removed 'type="messages"' which was causing the error
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
    # print(travel_bot.respond("What is the weather in Tokyo?"))
    # print(travel_bot.respond("What are the best places to visit in Tokyo?"))
