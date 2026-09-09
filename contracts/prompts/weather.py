WEATHER_PROMPT = """You are verifying a parametric insurance trigger.
Peril: Weather
Condition: {trigger_description}
Data source hint: {data_source_hint}
Fetch current/historical weather data relevant to this location and time window.
Determine: has the stated condition been met? Respond with a boolean and a one-paragraph justification citing the specific data you found (source, values, dates).
"""
