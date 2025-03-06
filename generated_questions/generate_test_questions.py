import openai
import os
from dotenv import load_dotenv
import json
import pandas as pd

# Load environment variables
load_dotenv()

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def _generate_test_questions_for_router():
    """
    Generate test questions that would trigger each tool in the travel agent system.
    """
    prompt = """
    Generate 3 user questions for each of the following travel agent tools:
    
    1. get_travel_info - Retrieves travel information for a specified destination
    2. flight_search - Searches for available flights between two locations
    3. create_itinerary - Creates a travel itinerary for a destination between specified dates
    4. create_packing_list - Generates a packing list for a trip based on destination and dates
    
    Format the response as a JSON object with tool names as keys and arrays of questions as values, 
    as well as a list of expected parameters and their values.
    
    Try and trick the model into using the wrong tool.
    
    Expected output:
    {
        "questions": [
            {
                "question": "user_question",
                "expected_output": "tool_name",
                "parameters": {"parameter1": "value1", "parameter2": "value2", "parameter3": "value3"}
            }
        ]
    }
    """
    
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates test questions for a travel agent chatbot."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    questions = json.loads(response.choices[0].message.content)
    return questions

def generate_test_questions_for_router():
    test_questions = _generate_test_questions_for_router()
    print(json.dumps(test_questions, indent=2))
    
    # Prepare data for two separate DataFrames
    function_rows = []
    parameter_rows = []
    
    for question_data in test_questions["questions"]:
        # DataFrame for expected output and question
        function_rows.append({
            'expected_output': question_data['expected_output'],
            'question': question_data['question']
        })
        
        # DataFrame for question and parameters
        parameter_rows.append({
            'question': question_data['question'],
            'parameters': json.dumps(question_data['parameters'])
        })
    
    # Create DataFrames and write to CSV files
    function_df = pd.DataFrame(function_rows)
    function_df.to_csv('generated_questions/test_router_functions.csv', index=False)
    
    parameter_df = pd.DataFrame(parameter_rows)
    parameter_df.to_csv('generated_questions/test_router_parameters.csv', index=False)
    
    print(f"\nTest questions written to test_router_functions.csv and test_router_parameters.csv")

def generate_hard_agent_questions():
    prompt = """
    Generate 3 user questions for each of the following travel agent tools:
    
    1. get_travel_info - Retrieves travel information for a specified destination
    2. flight_search - Searches for available flights between two locations
    3. create_itinerary - Creates a travel itinerary for a destination between specified dates
    4. create_packing_list - Generates a packing list for a trip based on destination and dates
    
    The questions should be designed to test the agent's ability to handle complex queries and 
    provide accurate and helpful responses.

    Output a json object with a list of questions. Do not include a key or mention of the tool names, just the list of questions.
    """
    
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates test questions for a travel agent chatbot."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    print(response.choices[0].message.content)
    
    questions = json.loads(response.choices[0].message.content)
    # Create a DataFrame from the questions
    hard_questions_df = pd.DataFrame(questions)
    
    # Write to CSV file
    hard_questions_df.to_csv('generated_questions/test_hard_agent_questions.csv', index=False)
    
    print(f"\nHard agent questions written to test_hard_agent_questions.csv")

if __name__ == "__main__":
    # generate_test_questions_for_router()
    generate_hard_agent_questions()