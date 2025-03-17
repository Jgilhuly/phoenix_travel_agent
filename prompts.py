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
    
def create_itinerary_prompt():
    params = CompletionCreateParamsBase(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an itinerary generator. Craft an itinerary for a trip based on the description provided by the user."
            },
            {
                "role": "user",
                "content": "Destination: {{destination}} \n Check In Date: {{checkin_date}} \n Check Out Date: {{checkout_date}} \n Budget: {{budget}} \n Interests: {{interests}}"
            }
        ]
    )
    
    client.prompts.create(
        name="travel-agent-itinerary",
        prompt_description="A prompt for the travel agent to create an itinerary.",
        version=PromptVersion.from_openai(params)
    )
    
def create_packing_list_prompt():
    params = CompletionCreateParamsBase(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a packing list creator. Create a packing list for a trip to the specified destination, over the specified time period."
            },
            {
                "role": "user",
                "content": "Destination: {{destination}} \n Check In Date: {{checkin_date}} \n Check Out Date: {{checkout_date}} \n Budget: {{budget}} \n Interests: {{interests}}"
            }
        ]
    )
    
    client.prompts.create(
        name="travel-agent-packing",
        prompt_description="A prompt for the travel agent to create a packing list.",
        version=PromptVersion.from_openai(params)
    )
    
def create_info_prompt():
    params = CompletionCreateParamsBase(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a travel expert. Provide current travel information, attractions, and tips for the specified destination. Make sure you fully answer the users question and don't miss any particular requests."
            },
            {
                "role": "user",
                "content": "Destination: {{destination}}"
            }
        ]
    )
    
    client.prompts.create(
        name="travel-agent-info",
        prompt_description="A prompt for the travel agent to provide information about a destination.",
        version=PromptVersion.from_openai(params)
    )

if __name__ == "__main__":
    create_router_prompt()
    create_itinerary_prompt()
    create_packing_list_prompt()
    create_info_prompt()