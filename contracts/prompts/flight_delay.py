FLIGHT_DELAY_PROMPT = """You are verifying a parametric insurance trigger.
Peril: Flight Delay
Condition: {trigger_description}
Data source hint: {data_source_hint}
Fetch flight status/tracking data for the specified flight and date.
Determine: has the stated delay condition been met? Respond with a boolean and a one-paragraph justification citing the specific flight status data you found.
"""
