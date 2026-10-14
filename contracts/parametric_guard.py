# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
import time
from typing import Optional, List, Dict, Any

try:
    from genlayer import *
except (ImportError, ModuleNotFoundError):
    # Standalone mock environment for local unit testing
    class u256(int):
        def __new__(cls, val=0):
            return super().__new__(cls, int(val))

    class Address(str):
        pass

    class TreeMap(dict):
        pass

    class MockVM:
        class UserError(ValueError):
            pass

    class MockGL:
        class MockMessage:
            sender_address: str = "0xUnderwriter11111111111111111111111111111111"
            sender: str = "0xUnderwriter11111111111111111111111111111111"
            value: int = 0
            timestamp: int = 1000

        class MockNondet:
            class MockWeb:
                @staticmethod
                def get(url: str):
                    return f"MOCK_WEB_DATA_FROM_{url}"

            class MockLLM:
                @staticmethod
                def prompt(prompt_str: str) -> str:
                    return '{"triggered": true, "justification": "Verified trigger condition from data source."}'

            web = MockWeb()
            llm = MockLLM()

            @staticmethod
            def exec_prompt(prompt_str: str) -> str:
                return '{"triggered": true, "justification": "Verified trigger condition from data source."}'

        class MockEqPrinciple:
            @staticmethod
            def prompt_non_comparative(fn, task: str = "", criteria: str = ""):
                return fn()

        message = MockMessage()
        nondet = MockNondet()
        eq_principle = MockEqPrinciple()
        vm = MockVM()

        @staticmethod
        def transfer(recipient: str, amount: int):
            pass

        class public:
            @staticmethod
            def write(fn):
                return fn

            @staticmethod
            def view(fn):
                return fn

        class Contract:
            pass

    gl = MockGL()


class Policy(str):
    """
    Serializable policy string representation that also acts as a rich object
    for local test environments and GenLayer JSON outputs.
    """
    def __new__(cls, data):
        s = json.dumps(data) if isinstance(data, dict) else str(data)
        instance = super().__new__(cls, s)
        parsed = data if isinstance(data, dict) else json.loads(s)
        object.__setattr__(instance, "_data", parsed)
        return instance

    def __getattr__(self, name):
        data = getattr(self, "_data", {})
        if name in data:
            val = data[name]
            if name in ("premium", "payout", "coverage_start", "coverage_end", "policy_id") and val is not None:
                return u256(val)
            if name in ("underwriter", "buyer") and val is not None:
                return Address(val)
            return val
        raise AttributeError(f"'Policy' object has no attribute '{name}'")


# -------------------------------------------------------------
# Inlined Peril Verification Prompts (Self-contained for GenLayer VM)
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


class ParametricGuard(getattr(gl, "Contract", object)):
    policies: TreeMap[str, str]
    next_policy_id: u256

    def __init__(self):
        self.policies = TreeMap()
        self.next_policy_id = u256(1)

    def _get_sender(self) -> str:
        if hasattr(gl, "message"):
            if hasattr(gl.message, "sender") and gl.message.sender:
                return str(gl.message.sender)
            if hasattr(gl.message, "sender_address") and gl.message.sender_address:
                return str(gl.message.sender_address)
        return "0x0000000000000000000000000000000000000000"

    def _get_current_timestamp(self) -> int:
        if hasattr(gl, "message") and hasattr(gl.message, "timestamp") and gl.message.timestamp:
            return int(gl.message.timestamp)
        if hasattr(gl, "block") and hasattr(gl.block, "timestamp") and gl.block.timestamp:
            return int(gl.block.timestamp)
        return int(time.time())

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
        underwriter_addr = self._get_sender()

        sent_value = getattr(gl.message, "value", 0)
        if sent_value and int(sent_value) > 0 and int(sent_value) < int(payout):
            raise gl.vm.UserError(f"Underwriter collateral required: expected {payout}, received {sent_value}")
        elif not sent_value and getattr(gl.message, "sender", None) and getattr(gl.message, "value", None) == 0:
            # Enforce collateral in environments where gl.message.value is explicitly tracked
            if hasattr(gl.message, "value") and int(getattr(gl.message, "value", 0)) < int(payout):
                raise gl.vm.UserError(f"Underwriter collateral required: expected {payout}, received {sent_value}")

        if int(coverage_start) >= int(coverage_end):
            raise gl.vm.UserError("Coverage start must be strictly before coverage end")

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

        now = self._get_current_timestamp()
        if now >= int(policy.get("coverage_start", 0)):
            raise gl.vm.UserError(f"Coverage window already started or expired (now: {now}, start: {policy.get('coverage_start')})")

        sent_value = getattr(gl.message, "value", 0)
        if sent_value and int(sent_value) > 0 and int(sent_value) != int(policy.get("premium", 0)):
            raise gl.vm.UserError(f"Incorrect premium sent: expected {policy.get('premium')}, got {sent_value}")

        policy["buyer"] = self._get_sender()
        policy["status"] = "purchased"
        self.policies[pid] = json.dumps(policy)

    @gl.public.write
    def resolve_policy(self, policy_id: u256):
        pid = str(int(policy_id))
        raw_policy = self.policies.get(pid, None)
        if raw_policy is None:
            raise gl.vm.UserError(f"Policy {pid} does not exist")

        policy = json.loads(raw_policy)
        if policy.get("status") not in ("purchased", "resolution_inconclusive"):
            raise gl.vm.UserError(f"Policy cannot be resolved: status is '{policy.get('status')}', expected 'purchased' or 'resolution_inconclusive'")

        now = self._get_current_timestamp()
        if now < int(policy.get("coverage_end", 0)):
            raise gl.vm.UserError(f"Coverage window has not ended yet (now: {now}, end: {policy.get('coverage_end')})")

        isolated_peril = str(policy.get("peril_type", ""))
        isolated_trigger = str(policy.get("trigger_description", ""))
        isolated_hint = str(policy.get("data_source_hint", ""))

        formatted_prompt = get_verification_prompt(
            peril_type=isolated_peril,
            trigger_description=isolated_trigger,
            data_source_hint=isolated_hint
        )

        def validator_evaluation() -> str:
            # --- Source evidence fetch ---
            web_content = None
            hint_str = (isolated_hint or "").strip()

            url_to_fetch = None
            if hint_str.startswith("http://") or hint_str.startswith("https://"):
                url_to_fetch = hint_str
            elif "." in hint_str and " " not in hint_str and not hint_str.startswith("{"):
                url_to_fetch = f"https://{hint_str}"

            if url_to_fetch:
                try:
                    resp = gl.nondet.web.get(url_to_fetch)
                    if resp is not None:
                        if hasattr(resp, "body"):
                            if isinstance(resp.body, bytes):
                                raw_text = resp.body.decode("utf-8", errors="replace")[:2000]
                            else:
                                raw_text = str(resp.body)[:2000]
                        else:
                            raw_text = str(resp)[:2000]

                        clean_text = raw_text.strip()
                        if clean_text and len(clean_text) >= 10:
                            lower_text = clean_text.lower()
                            if not any(err in lower_text for err in ["404 not found", "502 bad gateway", "503 service unavailable", "500 internal server error", '"error": true']):
                                web_content = clean_text
                except Exception:
                    web_content = None

            # Safeguard: if source evidence is unavailable or could not be obtained,
            # resolution MUST be inconclusive – unavailable source evidence cannot produce a conclusive result.
            if web_content is None:
                return json.dumps({
                    "triggered": None,
                    "justification": f"SOURCE_UNAVAILABLE: could not obtain valid source evidence from hint '{isolated_hint}'."
                })

            effective_web_content = web_content

            evaluation_instruction = (
                f"{formatted_prompt}\n\n"
                f"--- REAL-WORLD DATA EVIDENCE ---\n"
                f"{effective_web_content}\n"
                f"--------------------------------\n\n"
                "Determine if the condition has been met based strictly on the real-world data evidence above.\n"
                "If the evidence is unavailable, missing, or insufficient to reach a conclusive determination, you MUST set 'triggered' to null.\n"
                "Respond in valid JSON with exactly two fields:\n"
                "{\n"
                '  "triggered": true, false, or null,\n'
                '  "justification": "One-paragraph justification citing specific data values, sources, and dates."\n'
                "}"
            )

            # --- Model evidence fetch ---
            raw_response = ""
            if hasattr(gl.nondet, "llm") and hasattr(gl.nondet.llm, "prompt") and callable(gl.nondet.llm.prompt):
                try:
                    raw_response = gl.nondet.llm.prompt(evaluation_instruction)
                except Exception:
                    raw_response = ""

            if not raw_response and hasattr(gl.nondet, "exec_prompt") and callable(gl.nondet.exec_prompt):
                try:
                    raw_response = gl.nondet.exec_prompt(evaluation_instruction)
                except Exception:
                    raw_response = ""

            # Safeguard: if no model response could be obtained, resolution is inconclusive.
            if not raw_response or not str(raw_response).strip():
                return json.dumps({
                    "triggered": None,
                    "justification": "MODEL_UNAVAILABLE: no LLM response could be obtained for this evaluation."
                })

            if isinstance(raw_response, dict):
                triggered_val = raw_response.get("triggered")
                if not isinstance(triggered_val, bool):
                    return json.dumps({
                        "triggered": None,
                        "justification": f"MODEL_INCONCLUSIVE: {raw_response.get('justification', 'model could not produce a conclusive boolean verdict.')}"
                    })
                return json.dumps({
                    "triggered": triggered_val,
                    "justification": str(raw_response.get("justification", "Trigger condition verified by validators."))
                })

            try:
                clean_json = str(raw_response).strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```", 1)[1].split("```", 1)[0].strip()

                parsed = json.loads(clean_json)
                triggered_val = parsed.get("triggered")
                if not isinstance(triggered_val, bool):
                    return json.dumps({
                        "triggered": None,
                        "justification": f"MODEL_INCONCLUSIVE: {parsed.get('justification', 'model could not produce a conclusive boolean verdict.')}"
                    })
                return json.dumps({
                    "triggered": triggered_val,
                    "justification": str(parsed.get("justification", "Trigger condition verified by validators."))
                })
            except Exception:
                # Unparseable response – treat as inconclusive.
                return json.dumps({
                    "triggered": None,
                    "justification": "MODEL_UNPARSEABLE: validator response could not be parsed as valid JSON."
                })

        consensus_result_raw = gl.eq_principle.prompt_non_comparative(
            validator_evaluation,
            task="Determine whether the parametric condition was triggered and justify with data citations.",
            criteria="Validators must agree on the boolean 'triggered' value. Justifications are equivalent if they corroborate the same underlying factual determination."
        )

        try:
            consensus_data = json.loads(consensus_result_raw)
            triggered = consensus_data.get("triggered")  # None or bool
            justification = str(consensus_data.get("justification", "Condition evaluated by validators."))
        except Exception:
            triggered = None
            justification = str(consensus_result_raw)[:500] or "Condition evaluated by validators."

        # Inconclusive: evidence was unavailable at the source or model level.
        # Must NOT produce a conclusive result (status is set to resolution_inconclusive,
        # never resolved_triggered or resolved_not_triggered, and no funds are transferred).
        if not isinstance(triggered, bool):
            policy["status"] = "resolution_inconclusive"
            policy["resolution_justification"] = justification
            self.policies[pid] = json.dumps(policy)
            raise gl.vm.UserError(
                f"Policy {pid} resolution inconclusive: {justification}"
            )

        policy["resolution_justification"] = justification

        if triggered:
            buyer_addr = policy.get("buyer")
            payout_amount = int(policy.get("payout", 0))
            if not buyer_addr:
                raise gl.vm.UserError(f"Policy {pid} has no registered buyer for payout")
            # State must only change if the transfer succeeds.
            try:
                gl.transfer(Address(buyer_addr), payout_amount)
            except Exception as e:
                raise gl.vm.UserError(f"Payout transfer of {payout_amount} to {buyer_addr} failed: {e}")
            policy["status"] = "resolved_triggered"
        else:
            underwriter_addr = policy.get("underwriter")
            refund_amount = int(policy.get("payout", 0)) + int(policy.get("premium", 0))
            if not underwriter_addr:
                raise gl.vm.UserError(f"Policy {pid} has no registered underwriter for refund")
            # State must only change if the transfer succeeds.
            try:
                gl.transfer(Address(underwriter_addr), refund_amount)
            except Exception as e:
                raise gl.vm.UserError(f"Refund transfer of {refund_amount} to {underwriter_addr} failed: {e}")
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

        now = self._get_current_timestamp()
        if now < int(policy.get("coverage_start", 0)):
            raise gl.vm.UserError(f"Coverage has not started yet (now: {now}, start: {policy.get('coverage_start')})")

        underwriter_addr = policy.get("underwriter")
        payout_amount = int(policy.get("payout", 0))
        if not underwriter_addr:
            raise gl.vm.UserError(f"Policy {pid} has no registered underwriter for collateral refund")

        # State must only change if the collateral refund transfer succeeds.
        try:
            gl.transfer(Address(underwriter_addr), payout_amount)
        except Exception as e:
            raise gl.vm.UserError(f"Expiry collateral refund of {payout_amount} to {underwriter_addr} failed: {e}")

        policy["status"] = "expired"
        self.policies[pid] = json.dumps(policy)

    @gl.public.view
    def get_policy(self, policy_id: u256) -> str:
        pid = str(int(policy_id))
        raw_policy = self.policies.get(pid, None)
        if raw_policy is None:
            raise gl.vm.UserError(f"Policy {pid} not found")
        return Policy(json.loads(raw_policy))

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
