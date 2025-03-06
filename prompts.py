from phoenix.client import Client
from phoenix.client.types import PromptVersion
from openai.types.chat.completion_create_params import CompletionCreateParamsBase
import tools
from dotenv import load_dotenv

load_dotenv()

client = Client()

def get_prompt(prompt_identifier):
    return client.prompts.get(prompt_identifier=prompt_identifier)

def create_router_prompt():
    params = CompletionCreateParamsBase(
        model="gpt-4o-mini",
        tools=tools.get_tools(),
        messages=[
            {
                "role": "system",
                "content": "You are a travel agent. You are given a user's request and you need to route it to the appropriate tool."
            }
        ]
    )
    
    client.prompts.create(
        name="travel-agent-router",
        prompt_description="A router prompt for the travel agent.",
        version=PromptVersion.from_openai(params)
    )

if __name__ == "__main__":
    create_router_prompt()