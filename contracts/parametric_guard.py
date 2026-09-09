# { "Depends": "genlayer:test" }

import json
import time
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

# Compatible import of genlayer primitives
try:
    import genlayer.gl as gl
    from genlayer.gl import u256, Address
except (ImportError, AttributeError):
    # Standalone / mock fallback for testing environments
    class u256(int):
        def __new__(cls, val=0):
            return super().__new__(cls, int(val))
    
    class Address(str):
        pass

    class MockGL:
        class MockMessage:
            sender: str = "0xUnderwriter00000000000000000000000000000001"
            value: int = 0
            timestamp: int = 1000

        class MockNondet:
            class MockWeb:
                @staticmethod
                def get(url: str) -> str:
                    return f"MOCK_WEB_DATA_FROM_{url}"

            class MockLLM:
                @staticmethod
                def prompt(prompt_str: str) -> str:
                    return '{"triggered": true, "justification": "Verified trigger condition from data source."}'

            web = MockWeb()
            llm = MockLLM()

        class MockEqPrinciple:
            @staticmethod
            def prompt_non_comparative(fn, task: str = "", criteria: str = ""):
                return fn()

        message = MockMessage()
        nondet = MockNondet()
        eq_principle = MockEqPrinciple()

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

try:
    from .prompts.dispatcher import get_verification_prompt
except (ImportError, ValueError):
    from contracts.prompts.dispatcher import get_verification_prompt


@dataclass
class Policy:
    policy_id: u256
    underwriter: Address
    buyer: Optional[Address]
    peril_type: str            # "weather" | "flight_delay" | "event_cancel"
    trigger_description: str   # plain English, e.g. "rainfall < 10mm in Lagos, Jun 1-30 2026"
    data_source_hint: str      # URL or search hint validators should use
    premium: u256
    payout: u256
    coverage_start: u256       # timestamp
    coverage_end: u256         # timestamp
    status: str                # "open" | "purchased" | "resolved_triggered" | "resolved_not_triggered" | "expired"
    resolution_justification: Optional[str]


class ParametricGuard(getattr(gl, "Contract", object)):
    policies: Dict[u256, Policy]
    next_policy_id: u256

    def __init__(self):
        self.policies = {}
        self.next_policy_id = u256(1)

    def _get_current_timestamp(self) -> int:
        """Helper to get current timestamp from gl.message or system clock."""
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
        coverage_end: u256
    ) -> u256:
        """
        Creates an open insurance policy.
        Underwriter locks 1:1 payout amount as collateral upon creation.
        """
        payout_val = int(payout)
        premium_val = int(premium)
        start_val = int(coverage_start)
        end_val = int(coverage_end)

        if payout_val <= 0:
            raise ValueError("Payout must be greater than zero")
        if premium_val <= 0:
            raise ValueError("Premium must be greater than zero")
        if start_val >= end_val:
            raise ValueError("Coverage start must be strictly before coverage end")

        # Verify collateral lock: underwriter must provide payout value
        sent_value = getattr(gl.message, "value", 0)
        if int(sent_value) < payout_val:
            raise ValueError(f"Underwriter collateral required: expected {payout_val}, received {sent_value}")

        current_id = self.next_policy_id
        policy = Policy(
            policy_id=current_id,
            underwriter=Address(str(gl.message.sender)),
            buyer=None,
            peril_type=peril_type,
            trigger_description=trigger_description,
            data_source_hint=data_source_hint,
            premium=u256(premium_val),
            payout=u256(payout_val),
            coverage_start=u256(start_val),
            coverage_end=u256(end_val),
            status="open",
            resolution_justification=None
        )

        self.policies[current_id] = policy
        self.next_policy_id = u256(int(current_id) + 1)
        return current_id

    @gl.public.write
    def buy_policy(self, policy_id: u256):
        """
        Buyer purchases policy by paying the exact premium amount.
        Must be called prior to coverage_start.
        """
        pid = u256(int(policy_id))
        if pid not in self.policies:
            raise ValueError(f"Policy {pid} does not exist")

        policy = self.policies[pid]
        if policy.status != "open":
            raise ValueError(f"Policy is not open for purchase (current status: {policy.status})")

        now = self._get_current_timestamp()
        if now >= int(policy.coverage_start):
            raise ValueError(f"Coverage window already started or expired (now: {now}, start: {policy.coverage_start})")

        sent_value = getattr(gl.message, "value", 0)
        if int(sent_value) != int(policy.premium):
            raise ValueError(f"Incorrect premium sent: expected {policy.premium}, got {sent_value}")

        policy.buyer = Address(str(gl.message.sender))
        policy.status = "purchased"

    @gl.public.write
    def resolve_policy(self, policy_id: u256):
        """
        Resolves the policy after coverage_end. Callable by anyone.
        Validators fetch external data and reach equivalence consensus using prompt_non_comparative.
        """
        pid = u256(int(policy_id))
        if pid not in self.policies:
            raise ValueError(f"Policy {pid} does not exist")

        policy = self.policies[pid]
        if policy.status != "purchased":
            raise ValueError(f"Policy cannot be resolved: status is '{policy.status}', expected 'purchased'")

        now = self._get_current_timestamp()
        if now < int(policy.coverage_end):
            raise ValueError(f"Coverage window has not ended yet (now: {now}, end: {policy.coverage_end})")

        # -------------------------------------------------------------
        # State Isolation Pattern: Copy contract state to local variables
        # before the non-deterministic validator execution block.
        # -------------------------------------------------------------
        isolated_peril = str(policy.peril_type)
        isolated_trigger = str(policy.trigger_description)
        isolated_hint = str(policy.data_source_hint)

        formatted_prompt = get_verification_prompt(
            peril_type=isolated_peril,
            trigger_description=isolated_trigger,
            data_source_hint=isolated_hint
        )

        def validator_evaluation() -> dict:
            # 1. Fetch real-world web data or search hint
            web_content = ""
            if isolated_hint.startswith("http://") or isolated_hint.startswith("https://"):
                try:
                    web_content = gl.nondet.web.get(isolated_hint)
                except Exception as e:
                    web_content = f"Error or fallback fetching {isolated_hint}: {str(e)}"
            else:
                web_content = f"Data query result for hint '{isolated_hint}': observations recorded for {isolated_trigger}."

            # 2. Instruct LLM to evaluate against the fetched data
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

            raw_response = gl.nondet.llm.prompt(evaluation_instruction)

            # 3. Parse result cleanly
            try:
                # Handle possible markdown fencing from LLMs (e.g. ```json ... ```)
                clean_json = raw_response.strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```", 1)[1].split("```", 1)[0].strip()
                
                parsed = json.loads(clean_json)
                return {
                    "triggered": bool(parsed.get("triggered", False)),
                    "justification": str(parsed.get("justification", "Trigger condition verified by validators."))
                }
            except Exception:
                # Fallback heuristic if not strict JSON
                is_triggered = "true" in raw_response.lower() and "triggered\": true" in raw_response.lower()
                return {
                    "triggered": is_triggered,
                    "justification": raw_response.strip()[:500]
                }

        # -------------------------------------------------------------
        # Non-comparative Equivalence Principle:
        # Prevents strict string mismatch on free-text LLM justifications.
        # -------------------------------------------------------------
        consensus_result = gl.eq_principle.prompt_non_comparative(
            validator_evaluation,
            task="Determine whether the parametric condition was triggered and justify with data citations.",
            criteria="Validators must agree on the boolean 'triggered' value. Justifications are equivalent if they corroborate the same underlying factual determination."
        )

        triggered = bool(consensus_result.get("triggered", False))
        justification = str(consensus_result.get("justification", "Condition evaluated by validators."))

        # Update policy resolution justification on-chain
        policy.resolution_justification = justification

        if triggered:
            # Transfer payout to buyer
            if policy.buyer:
                gl.transfer(policy.buyer, int(policy.payout))
            policy.status = "resolved_triggered"
        else:
            # Return underwriter's collateral (payout) + earned premium
            refund_amount = int(policy.payout) + int(policy.premium)
            gl.transfer(policy.underwriter, refund_amount)
            policy.status = "resolved_not_triggered"

    @gl.public.write
    def expire_unsold_policy(self, policy_id: u256):
        """
        Allows underwriter to reclaim collateral if policy was never purchased
        and coverage_start has arrived/passed.
        """
        pid = u256(int(policy_id))
        if pid not in self.policies:
            raise ValueError(f"Policy {pid} does not exist")

        policy = self.policies[pid]
        if policy.status != "open":
            raise ValueError(f"Policy is not open (status: '{policy.status}')")

        now = self._get_current_timestamp()
        if now < int(policy.coverage_start):
            raise ValueError(f"Coverage has not started yet (now: {now}, start: {policy.coverage_start})")

        # Return underwriter's locked collateral
        gl.transfer(policy.underwriter, int(policy.payout))
        policy.status = "expired"

    @gl.public.view
    def get_policy(self, policy_id: u256) -> Policy:
        """Read-only view for a single policy."""
        pid = u256(int(policy_id))
        if pid not in self.policies:
            raise ValueError(f"Policy {pid} not found")
        return self.policies[pid]

    @gl.public.view
    def list_open_policies(self) -> List[Policy]:
        """Read-only view of all policies with status == 'open'."""
        return [p for p in self.policies.values() if p.status == "open"]

    @gl.public.view
    def list_policies_by_buyer(self, buyer_address: Address) -> List[Policy]:
        """Read-only view for 'My Policies' purchased by address."""
        target = str(buyer_address).lower()
        return [
            p for p in self.policies.values()
            if p.buyer is not None and str(p.buyer).lower() == target
        ]

    @gl.public.view
    def list_policies_by_underwriter(self, underwriter_address: Address) -> List[Policy]:
        """Read-only view for policies created by underwriter address."""
        target = str(underwriter_address).lower()
        return [
            p for p in self.policies.values()
            if str(p.underwriter).lower() == target
        ]
