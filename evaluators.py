import phoenix as px
from phoenix.experiments import evaluate_experiment
import json
import openai
from phoenix.evals import (
    OpenAIModel,
    llm_classify,
)
from phoenix.trace import SpanEvaluations
from phoenix.trace.dsl import SpanQuery
from dotenv import load_dotenv

load_dotenv()

def evaluate_router_function_call(output, expected):
    expected = expected.get("expected_output")
    output = output.get("messages")[-1]
    if output.get("tool_calls"):
        output = output.get("tool_calls")[0].get("function").get("name")
    else:
        if expected == "no tool call":
            return 1
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
        if expected == "no tool call":
            return 1
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

def llm_eval_qa_answer():
    llm_judge_prompt = """You are given a question and an answer. You must determine whether the
        given answer correctly answers the question. Here is the data:
            [BEGIN DATA]
            ************
            [Question]: {question}
            ************
            [Answer]: {answer}
            [END DATA]
        Your response must be a single word, either "correct" or "incorrect",
        and should not contain any text or characters aside from that word.
        "correct" means that the question is correctly and fully answered by the answer.
        "incorrect" means that the question is not correctly or only partially answered by the
        answer.
            """
    
    query = SpanQuery().where("parent_id is None").select(question="input.value", answer="output.value")
    spans = px.Client().query_spans(query, project_name="travel-agent-live")
    
    eval_spans = llm_classify(
        model=OpenAIModel(model="gpt-4o-mini"),
        template=llm_judge_prompt,
        data=spans,
        rails=["correct", "incorrect"],
        provide_explanation=True,
        concurrency=10
    )
    eval_spans["score"] = eval_spans["label"].apply(lambda x: 1 if x == "correct" else 0)

    px.Client().log_evaluations(SpanEvaluations(eval_name="QA_Answer", dataframe=eval_spans))
    
    

if __name__ == "__main__":
    # experiment = px.Client().get_experiment(experiment_id="RXhwZXJpbWVudDoxMzU=")
    # evaluate_experiment(
    #     experiment=experiment,
    #     evaluators=[
    #         # evaluate_router_function_call,
    #         evaluate_router_param_extraction
    #     ]
    # )
    llm_eval_qa_answer()