import pytest
from contracts.parametric_guard import ParametricGuard, Policy, gl, u256, Address


class MockConsensusEnvironment:
    """Direct-mode environment simulating validators, web fetches, and LLM consensus."""
    def __init__(self):
        self.sender = "0xUnderwriter11111111111111111111111111111111"
        self.value = 0
        self.timestamp = 1000
        self.transfers = []
        self.mock_web_response = "DEFAULT_WEB_DATA"
        self.mock_llm_response = '{"triggered": true, "justification": "Default verification justification."}'
        self.eq_principle_calls = []

        # Configure gl mocks
        gl.message.sender = self.sender
        gl.message.value = self.value
        gl.message.timestamp = self.timestamp
        gl.transfer = self._mock_transfer
        gl.nondet.web.get = self._mock_web_get
        gl.nondet.llm.prompt = self._mock_llm_prompt
        gl.eq_principle.prompt_non_comparative = self._mock_prompt_non_comparative

    def prank(self, sender: str, value: int = 0):
        self.sender = sender
        self.value = value
        gl.message.sender = sender
        gl.message.value = value

    def warp(self, timestamp: int):
        self.timestamp = timestamp
        gl.message.timestamp = timestamp

    def _mock_transfer(self, recipient: str, amount: int):
        self.transfers.append({"recipient": str(recipient), "amount": int(amount)})

    def _mock_web_get(self, url: str) -> str:
        return self.mock_web_response

    def _mock_llm_prompt(self, prompt_text: str) -> str:
        return self.mock_llm_response

    def _mock_prompt_non_comparative(self, fn, task: str = "", criteria: str = ""):
        self.eq_principle_calls.append({"task": task, "criteria": criteria})
        # Executes the validator evaluation block
        return fn()


@pytest.fixture
def env():
    return MockConsensusEnvironment()


@pytest.fixture
def contract(env):
    return ParametricGuard()


def test_triggered_resolution_pays_buyer(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    payout = 1000
    premium = 75
    start = 2000
    end = 3000

    # 1. Underwriter creates policy
    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy(
        peril_type="weather",
        trigger_description="rainfall < 10mm in Lagos, Jun 1-30 2026",
        data_source_hint="https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792",
        premium=u256(premium),
        payout=u256(payout),
        coverage_start=u256(start),
        coverage_end=u256(end)
    )

    # 2. Buyer purchases policy
    env.warp(1500)
    env.prank(buyer, value=premium)
    contract.buy_policy(pid)
    assert contract.get_policy(pid).status == "purchased"

    # 3. Fast-forward past coverage_end
    env.warp(3500)

    # 4. Mock validator web data and LLM trigger output
    env.mock_web_response = "Open-Meteo ERA5 Reanalysis: Total precipitation for Lagos (Jun 1-30, 2026): 6.4mm."
    env.mock_llm_response = (
        '{\n'
        '  "triggered": true,\n'
        '  "justification": "Verified Lagos weather data from Open-Meteo showing total rainfall of 6.4mm between Jun 1-30 2026, which is below the 10mm trigger threshold."\n'
        '}'
    )

    # Resolve policy
    env.transfers.clear()
    contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolved_triggered"
    assert policy.resolution_justification is not None
    assert "6.4mm" in policy.resolution_justification or "Open-Meteo" in policy.resolution_justification

    # Check that payout went to the buyer
    buyer_payout = next((t for t in env.transfers if t["recipient"] == buyer), None)
    assert buyer_payout is not None
    assert buyer_payout["amount"] == payout


def test_not_triggered_resolution_returns_collateral_and_premium_to_underwriter(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    payout = 1500
    premium = 100
    start = 2000
    end = 3000

    # 1. Underwriter creates flight delay policy
    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy(
        peril_type="flight_delay",
        trigger_description="Delta DL123 delay > 120 minutes on 2026-06-15",
        data_source_hint="https://flightaware.com/live/flight/DAL123",
        premium=u256(premium),
        payout=u256(payout),
        coverage_start=u256(start),
        coverage_end=u256(end)
    )

    # 2. Buyer purchases policy
    env.warp(1500)
    env.prank(buyer, value=premium)
    contract.buy_policy(pid)

    # 3. Fast-forward past coverage_end
    env.warp(3500)

    # 4. Mock flight data showing delay was only 15 minutes (not triggered)
    env.mock_web_response = "FlightAware: DAL123 on 2026-06-15 landed at 14:15 UTC. Scheduled 14:00 UTC. Delay: 15 minutes."
    env.mock_llm_response = (
        '{\n'
        '  "triggered": false,\n'
        '  "justification": "FlightAware logs confirm Delta flight DL123 on June 15 2026 incurred only a 15-minute arrival delay, well under the 120-minute policy threshold."\n'
        '}'
    )

    env.transfers.clear()
    contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolved_not_triggered"
    assert policy.resolution_justification is not None
    assert "15-minute" in policy.resolution_justification or "120-minute" in policy.resolution_justification

    # Check that underwriter received payout (locked collateral) + earned premium
    underwriter_transfer = next((t for t in env.transfers if t["recipient"] == underwriter), None)
    assert underwriter_transfer is not None
    assert underwriter_transfer["amount"] == payout + premium


def test_equivalence_principle_prompt_non_comparative_used_for_free_text(env, contract):
    """
    Confirms gl.eq_principle.prompt_non_comparative is explicitly used
    rather than strict string equality, accommodating differently-worded
    but semantically equivalent validator justifications.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    payout = 500
    premium = 25
    start = 2000
    end = 3000

    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy("weather", "drought in Kenya", "open-meteo.com", u256(premium), u256(payout), u256(start), u256(end))

    env.warp(1500)
    env.prank(buyer, value=premium)
    contract.buy_policy(pid)

    env.warp(3500)
    env.mock_llm_response = '{"triggered": true, "justification": "Drought conditions verified by satellite precipitation metrics."}'

    # Clear call records
    env.eq_principle_calls.clear()

    contract.resolve_policy(pid)

    # Verify that gl.eq_principle.prompt_non_comparative was called with proper task & criteria
    assert len(env.eq_principle_calls) == 1
    call = env.eq_principle_calls[0]
    assert "Determine whether the parametric condition was triggered" in call["task"]
    assert "Validators must agree on the boolean 'triggered' value" in call["criteria"]
    assert "equivalent" in call["criteria"].lower()

    policy = contract.get_policy(pid)
    assert policy.status == "resolved_triggered"
