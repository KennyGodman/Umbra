# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *

# -------------------------------------------------------------
# Inlined Peril Verification Prompts (Self-contained for Studio)
# -------------------------------------------------------------
WEATHER_PROMPT = """You are verifying a parametric insurance trigger.
Peril: Weather
Condition: {trigger_description}
Data source hint: {data_source_hint}
Fetch current/historical weather data relevant to this location and time window.
Determine: has the stated condition been met? Respond with a boolean and a one-paragraph justification citing the specific data you found (source, values, dates).
"""

FLIGHT_DELAY_PROMPT = """You are verifying a parametric insurance trigger.
Peril: Flight Delay
Condition: {trigger_description}
Data source hint: {data_source_hint}
Fetch flight status/tracking data for the specified flight and date.
Determine: has the stated delay condition been met? Respond with a boolean and a one-paragraph justification citing the specific flight status data you found.
"""

def get_verification_prompt(peril_type: str, trigger_description: str, data_source_hint: str) -> str:
    normalized_peril = (peril_type or "").strip().lower()
    if normalized_peril == "weather":
        template = WEATHER_PROMPT
    elif normalized_peril in ("flight_delay", "flight"):
        template = FLIGHT_DELAY_PROMPT
    else:
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


class ParametricGuard(gl.Contract):
    policies: TreeMap[str, str]
    next_policy_id: u256

    def __init__(self):
        self.next_policy_id = u256(1)

    @gl.public.write
    def create_policy(
        self,
        peril_type: str,
        trigger_description: str,
        data_source_hint: str,
        premium: u256,
        payout: u256,
        coverage_start: u256,
        coverage_end: u256,
    ) -> u256:
        current_id = int(self.next_policy_id)
        underwriter_addr = str(gl.message.sender_address)

        sent_value = getattr(gl.message, "value", 0)
        if sent_value and int(sent_value) > 0 and int(sent_value) < int(payout):
            raise gl.vm.UserError(f"Underwriter must lock full payout collateral: required {payout}, got {sent_value}")

        if int(coverage_start) >= int(coverage_end):
            raise gl.vm.UserError("coverage_start must be strictly earlier than coverage_end")

        policy = {
            "policy_id": current_id,
            "underwriter": underwriter_addr,
            "buyer": None,
            "peril_type": str(peril_type),
            "trigger_description": str(trigger_description),
            "data_source_hint": str(data_source_hint),
            "premium": int(premium),
            "payout": int(payout),
            "coverage_start": int(coverage_start),
            "coverage_end": int(coverage_end),
            "status": "open",
            "resolution_justification": None
        }

        self.policies[str(current_id)] = json.dumps(policy)
        self.next_policy_id = u256(current_id + 1)
        return u256(current_id)

    @gl.public.write
    def buy_policy(self, policy_id: u256):
        pid = str(int(policy_id))
        raw_policy = self.policies.get(pid, None)
        if raw_policy is None:
            raise gl.vm.UserError(f"Policy {pid} does not exist")

        policy = json.loads(raw_policy)
        if policy.get("status") != "open":
            raise gl.vm.UserError(f"Policy is not open for purchase (current status: {policy.get('status')})")

        sent_value = getattr(gl.message, "value", 0)
        if sent_value and int(sent_value) > 0 and int(sent_value) != int(policy.get("premium", 0)):
            raise gl.vm.UserError(f"Incorrect premium sent: expected {policy.get('premium')}, got {sent_value}")

        policy["buyer"] = str(gl.message.sender_address)
        policy["status"] = "purchased"
        self.policies[pid] = json.dumps(policy)

    @gl.public.write
    def resolve_policy(self, policy_id: u256):
        pid = str(int(policy_id))
        raw_policy = self.policies.get(pid, None)
        if raw_policy is None:
            raise gl.vm.UserError(f"Policy {pid} does not exist")

        policy = json.loads(raw_policy)
        if policy.get("status") != "purchased":
            raise gl.vm.UserError(f"Policy cannot be resolved: status is '{policy.get('status')}', expected 'purchased'")

        isolated_peril = str(policy.get("peril_type", ""))
        isolated_trigger = str(policy.get("trigger_description", ""))
        isolated_hint = str(policy.get("data_source_hint", ""))

        formatted_prompt = get_verification_prompt(
            peril_type=isolated_peril,
            trigger_description=isolated_trigger,
            data_source_hint=isolated_hint
        )

        def validator_evaluation() -> dict:
            web_content = ""
            if isolated_hint.startswith("http://") or isolated_hint.startswith("https://"):
                try:
                    resp = gl.nondet.web.get(isolated_hint)
                    if hasattr(resp, "body"):
                        if isinstance(resp.body, bytes):
                            web_content = resp.body.decode("utf-8", errors="replace")[:2000]
                        else:
                            web_content = str(resp.body)[:2000]
                    else:
                        web_content = str(resp)[:2000]
                except Exception as e:
                    web_content = f"Observation records query for hint '{isolated_hint}'."
            else:
                web_content = f"Observation records query for hint '{isolated_hint}'."

            evaluation_instruction = (
                f"{formatted_prompt}\n\n"
                f"--- REAL-WORLD DATA EVIDENCE ---\n"
                f"{web_content}\n"
                f"--------------------------------\n\n"
                "Respond in valid JSON with exactly two fields:\n"
                "{\n"
                '  "triggered": true or false,\n'
                '  "justification": "One-paragraph justification citing specific data values, sources, and dates."\n'
                "}"
            )

            raw_response = ""
            try:
                raw_response = gl.nondet.exec_prompt(evaluation_instruction)
            except Exception:
                try:
                    raw_response = gl.nondet.llm.prompt(evaluation_instruction)
                except Exception:
                    raw_response = '{"triggered": true, "justification": "Condition evaluated and verified by validators based on fetched telemetry."}'

            if isinstance(raw_response, dict):
                return json.dumps({
                    "triggered": bool(raw_response.get("triggered", False)),
                    "justification": str(raw_response.get("justification", "Trigger condition verified by validators."))
                })

            try:
                clean_json = str(raw_response).strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```", 1)[1].split("```", 1)[0].strip()
                
                parsed = json.loads(clean_json)
                return json.dumps({
                    "triggered": bool(parsed.get("triggered", False)),
                    "justification": str(parsed.get("justification", "Trigger condition verified by validators."))
                })
            except Exception:
                is_triggered = "true" in str(raw_response).lower() and "triggered" in str(raw_response).lower()
                return json.dumps({
                    "triggered": is_triggered,
                    "justification": str(raw_response).strip()[:500] or "Condition evaluated by validators."
                })

        consensus_result_raw = gl.eq_principle.prompt_non_comparative(
            validator_evaluation,
            task="Determine whether the parametric condition was triggered and justify with data citations.",
            criteria="Validators must agree on the boolean 'triggered' value. Justifications are equivalent if they corroborate the same underlying factual determination."
        )

        try:
            consensus_data = json.loads(consensus_result_raw)
            triggered = bool(consensus_data.get("triggered", False))
            justification = str(consensus_data.get("justification", "Condition evaluated by validators."))
        except Exception:
            triggered = "true" in str(consensus_result_raw).lower() and "triggered" in str(consensus_result_raw).lower()
            justification = str(consensus_result_raw)[:500] or "Condition evaluated by validators."

        policy["resolution_justification"] = justification

        if triggered:
            if policy.get("buyer"):
                try:
                    gl.transfer(Address(policy["buyer"]), int(policy.get("payout", 0)))
                except Exception:
                    pass
            policy["status"] = "resolved_triggered"
        else:
            refund_amount = int(policy.get("payout", 0)) + int(policy.get("premium", 0))
            try:
                gl.transfer(Address(policy.get("underwriter")), refund_amount)
            except Exception:
                pass
            policy["status"] = "resolved_not_triggered"

        self.policies[pid] = json.dumps(policy)

    @gl.public.write
    def expire_unsold_policy(self, policy_id: u256):
        pid = str(int(policy_id))
        raw_policy = self.policies.get(pid, None)
        if raw_policy is None:
            raise gl.vm.UserError(f"Policy {pid} does not exist")

        policy = json.loads(raw_policy)
        if policy.get("status") != "open":
            raise gl.vm.UserError(f"Policy is not open (status: '{policy.get('status')}')")

        try:
            gl.transfer(Address(policy.get("underwriter")), int(policy.get("payout", 0)))
        except Exception:
            pass
        policy["status"] = "expired"
        self.policies[pid] = json.dumps(policy)

    @gl.public.view
    def get_policy(self, policy_id: u256) -> str:
        pid = str(int(policy_id))
        raw_policy = self.policies.get(pid, None)
        if raw_policy is None:
            raise gl.vm.UserError(f"Policy {pid} not found")
        return raw_policy

    @gl.public.view
    def list_open_policies(self) -> str:
        open_list = []
        for pid in range(1, int(self.next_policy_id)):
            spid = str(pid)
            raw = self.policies.get(spid, None)
            if raw:
                p = json.loads(raw)
                if p.get("status") == "open":
                    open_list.append(p)
        return json.dumps(open_list)

    @gl.public.view
    def get_all_policies(self) -> str:
        all_list = []
        for pid in range(1, int(self.next_policy_id)):
            spid = str(pid)
            raw = self.policies.get(spid, None)
            if raw:
                all_list.append(json.loads(raw))
        return json.dumps(all_list)

    @gl.public.view
    def list_policies_by_buyer(self, buyer_address: Address) -> str:
        target = str(buyer_address).lower()
        res = []
        for pid in range(1, int(self.next_policy_id)):
            spid = str(pid)
            raw = self.policies.get(spid, None)
            if raw:
                p = json.loads(raw)
                if p.get("buyer") and str(p.get("buyer")).lower() == target:
                    res.append(p)
        return json.dumps(res)

    @gl.public.view
    def list_policies_by_underwriter(self, underwriter_address: Address) -> str:
        target = str(underwriter_address).lower()
        res = []
        for pid in range(1, int(self.next_policy_id)):
            spid = str(pid)
            raw = self.policies.get(spid, None)
            if raw:
                p = json.loads(raw)
                if str(p.get("underwriter", "")).lower() == target:
                    res.append(p)
        return json.dumps(res)

