from .weather import WEATHER_PROMPT
from .flight_delay import FLIGHT_DELAY_PROMPT

def get_verification_prompt(peril_type: str, trigger_description: str, data_source_hint: str) -> str:
    """
    Selects the prompt template tailored to the peril_type and formats it with
    the policy's trigger description and data source hint.
    """
    normalized_peril = (peril_type or "").strip().lower()
    if normalized_peril == "weather":
        template = WEATHER_PROMPT
    elif normalized_peril in ("flight_delay", "flight"):
        template = FLIGHT_DELAY_PROMPT
    else:
        # Fallback generic prompt for other peril types (e.g. event_cancel)
        template = (
            "You are verifying a parametric insurance trigger.\n"
            f"Peril: {peril_type}\n"
            "Condition: {trigger_description}\n"
            "Data source hint: {data_source_hint}\n"
            "Fetch relevant real-world data from the hint.\n"
            "Determine: has the stated condition been met? Respond with a boolean and a one-paragraph justification citing specific data.\n"
        )

    return template.format(
        trigger_description=trigger_description,
        data_source_hint=data_source_hint
    )
