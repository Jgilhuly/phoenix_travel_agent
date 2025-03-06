from main import TravelAgentBot
import pandas as pd
travel_bot = TravelAgentBot()

questions = pd.read_csv("generated_questions/test_hard_agent_questions.csv")

# Process each question from the CSV file
for _, row in questions.iterrows():
    question = row['questions']
    print(f"Question: {question}")
    response = travel_bot.respond(question)
    travel_bot.clear_history()