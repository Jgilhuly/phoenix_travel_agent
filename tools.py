
import openai
import inspect
from typing import get_type_hints
import prompts

def get_travel_info(destination):
    """
    Retrieves travel information for a specified destination using OpenAI's API.
    
    Args:
        destination (str): The name of the destination to get information about
        
    Returns:
        str: Travel information including highlights and key details about the destination
    """
    # Call OpenAI API for travel information
    info_prompt = prompts.get_prompt("travel-agent-info")
    response = openai.chat.completions.create(
        **info_prompt.format(variables={"destination": destination})
    )
    
    # Extract the response text
    travel_info = response.choices[0].message.content
    return travel_info

def flight_search(origin, destination, departure_date, return_date):
    """
    Searches for available flights between two locations using the Google Flights API via SerpAPI.
    
    Args:
        origin (str): Departure airport code
        destination (str): Arrival airport code 
        departure_date (str): Outbound flight date in YYYY-MM-DD format
        return_date (str): Return flight date in YYYY-MM-DD format, optional for one-way flights
        
    Returns:
        str: Formatted string containing flight details including times, prices and layovers
    """
    try:
        from serpapi import GoogleSearch
        import os
        
        SERPER_API_KEY = os.getenv("SERPER_API_KEY")
        
        def format_minutes(total_minutes):
            if not isinstance(total_minutes, int) or total_minutes < 0:
                raise ValueError("Total minutes must be a non-negative integer.")
            hours = total_minutes // 60
            minutes = total_minutes % 60
            if hours > 0 and minutes > 0:
                return f"{hours} hr {minutes} min"
            elif hours > 0:
                return f"{hours} hr"
            else:
                return f"{minutes} min"

        def format_one_flight(flight_no, dep_port, arr_port, dep_time, arr_time, duration, airline, airplane):
            return f"{airline} {flight_no} - {dep_port} ({dep_time}) -> {arr_port} ({arr_time}) [{format_minutes(duration)}] - {airplane}"

        def get_formatted_flights_info(flights):
            formatted_flights = []
            for flight in flights:
                for part in flight["flights"]:
                    formatted_flights.append(
                        format_one_flight(
                            part["flight_number"],
                            part["departure_airport"]["id"], 
                            part["arrival_airport"]["id"],
                            part["departure_airport"]["time"],
                            part["arrival_airport"]["time"],
                            part["duration"],
                            part["airline"],
                            part["airplane"]
                        )
                    )
                if "layovers" in flight and len(flight["layovers"]) > 0:
                    formatted_flights.append(
                        f"Layover at {flight['layovers'][0]['id']}: {format_minutes(flight['layovers'][0]['duration'])}"
                    )
                formatted_flights.append(f"Total Duration: {format_minutes(flight['total_duration'])}")
                formatted_flights.append(f"Price (USD): ${flight['price']}")
                formatted_flights.append("")
            return "\n".join(formatted_flights)

        params = {
            "engine": "google_flights",
            "hl": "en", 
            "departure_id": origin,
            "arrival_id": destination,
            "outbound_date": departure_date,
            "return_date": return_date,
            "stops": 2,
            "currency": "USD",
            "api_key": SERPER_API_KEY
        }

        if return_date:
            params["type"] = "1"  # Round Trip
        else:
            params["type"] = "2"  # One Way

        search = GoogleSearch(params)
        results = search.get_dict()
        
        if "error" in results:
            return f"Error searching flights: {results['error']}"
            
        flights_data = results.get("best_flights", [])
        first_line = f"Flights from {origin} to {destination}:"
        return first_line + "\n\n" + get_formatted_flights_info(flights_data[:3])
        
    except Exception as e:
        return f"Failed to search flights: {str(e)}"

def create_itinerary(destination, checkin_date, checkout_date):
    """
    Creates a travel itinerary for a destination between specified dates.
    
    Args:
        destination (str): The destination city/location
        checkin_date (str): Start date in YYYY-MM-DD format
        checkout_date (str): End date in YYYY-MM-DD format
        
    Returns:
        str: Generated itinerary for the trip
    """
    itinerary_prompt = prompts.get_prompt("travel-agent-itinerary")
    response = openai.chat.completions.create(
        **itinerary_prompt.format(variables={"destination": destination, 
                                             "checkin_date": checkin_date, 
                                             "checkout_date": checkout_date})
    )
    return response.choices[0].message.content

def create_packing_list(destination, checkin_date, checkout_date):
    """
    Generates a packing list for a trip based on destination and dates.
    
    Args:
        destination (str): The destination city/location
        checkin_date (str): Trip start date in YYYY-MM-DD format
        checkout_date (str): Trip end date in YYYY-MM-DD format
        
    Returns:
        str: Customized packing list for the trip
    """
    packing_prompt = prompts.get_prompt("travel-agent-packing")
    response = openai.chat.completions.create(
        **packing_prompt.format(variables={"destination": destination, 
                                             "checkin_date": checkin_date, 
                                             "checkout_date": checkout_date})
    )
    return response.choices[0].message.content

def function_to_tool(func):
    """
    Converts a Python function with a docstring into an OpenAI-compatible tool definition.
    """
    signature = inspect.signature(func)
    params = {}
    
    for name, param in signature.parameters.items():
        param_type = get_type_hints(func).get(name, str)  # Default to str if not annotated
        param_type_str = param_type.__name__ if hasattr(param_type, "__name__") else "string"
        
        # Convert Python types to JSON Schema types
        if param_type_str == "str":
            param_type_str = "string"
        elif param_type_str == "int":
            param_type_str = "integer"
        elif param_type_str == "float":
            param_type_str = "number"
        elif param_type_str == "bool":
            param_type_str = "boolean"
        
        params[name] = {
            "type": param_type_str,
            "description": f"{name} parameter"
        }

    # Extract parameter descriptions from docstring if available
    if func.__doc__:
        docstring_lines = func.__doc__.strip().split('\n')
        for i, line in enumerate(docstring_lines):
            if 'Args:' in line:
                # Process the parameter descriptions in the docstring
                for j in range(i+1, len(docstring_lines)):
                    line = docstring_lines[j].strip()
                    if line and ':' in line:
                        parts = line.split(':', 1)
                        param_name = parts[0].strip()
                        if param_name in params:
                            params[param_name]["description"] = parts[1].strip()
                    elif not line or 'Returns:' in line:
                        break

    tool = {
        "type": "function",
        "function": {
            "name": func.__name__,
            "description": func.__doc__.strip() if func.__doc__ else "No description",
            "parameters": {
                "type": "object",
                "properties": params,
                "required": list(params.keys())
            }
        }
    }
    
    return tool


def get_tools():
    return [
        function_to_tool(get_travel_info),
        function_to_tool(flight_search),
        function_to_tool(create_itinerary),
        function_to_tool(create_packing_list)
    ]