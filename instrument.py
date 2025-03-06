from phoenix.otel import register
from openinference.instrumentation.openai import OpenAIInstrumentor
import os

def setup_tracing():
    tracer_provider = register(
        project_name="travel-agent",
        auto_instrument=True,
    )
    
    tracer = tracer_provider.get_tracer(__name__)
    return tracer