import phoenix as px
from phoenix.experiments import evaluate_experiment
import json
import openai
from dotenv import load_dotenv

load_dotenv()

def evaluate_router_function_call(output, expected):
    expected = expected.get("expected_output")
    output = output.get("messages")[-1]
    if output.get("tool_calls"):
        output = output.get("tool_calls")[0].get("function").get("name")
    else:
        return 0
    if str(output).replace(" ", "").lower() == str(expected).replace(" ", "").lower():
        return 1
    else:
        return 0
    
def evaluate_router_param_extraction(output, expected):
    output = output.get("messages")[-1]
    if output.get("tool_calls"):
        output = output.get("tool_calls")[0].get("function").get("arguments")
    else:
        return 0
    expected = expected.get("parameters")
    

    if isinstance(expected, str):
        expected = json.loads(expected)
    if isinstance(output, str):
        output = json.loads(output)
        

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an evaluator determining if two sets of parameters are semantically similar. Return only 1 if they are similar enough to be considered correct, or 0 if they are not similar."
            },
            {
                "role": "user",
                "content": f"Expected parameters: {expected}\nActual parameters: {output}\n\nAre these parameters semantically similar? Answer with only 1 or 0."
            }
        ],
    )
    
    evaluation_result = response.choices[0].message.content.strip()
    
    try:
        return int(evaluation_result)
    except ValueError:
        return 0

if __name__ == "__main__":
    experiment = px.Client().get_experiment(experiment_id="RXhwZXJpbWVudDoxMzQ=")
    evaluate_experiment(
        experiment=experiment,
        evaluators=[
            # evaluate_router_function_call,
            evaluate_router_param_extraction
        ]
    )