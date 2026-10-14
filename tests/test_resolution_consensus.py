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
        # When True, gl.nondet.web.get raises an exception
        self.web_fetch_fails = False
        # When True, gl.nondet.llm.prompt raises an exception
        self.llm_fails = False
        # When True, gl.transfer raises an exception
        self.transfer_fails = False

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
        if self.transfer_fails:
            raise RuntimeError("Transfer rejected by mock ledger")
        self.transfers.append({"recipient": str(recipient), "amount": int(amount)})

    def _mock_web_get(self, url: str) -> str:
        if self.web_fetch_fails:
            raise ConnectionError("Mock web fetch failure")
        return self.mock_web_response

    def _mock_llm_prompt(self, prompt_text: str) -> str:
        if self.llm_fails:
            raise RuntimeError("Mock LLM failure")
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


# ---------------------------------------------------------------------------
# New failure-path tests
# ---------------------------------------------------------------------------

def _make_purchased_policy(env, contract, underwriter, buyer,
                           peril="weather", hint="https://data.example.com/",
                           payout=1000, premium=50, start=2000, end=3000):
    """Helper: create + purchase a policy and fast-forward past coverage_end."""
    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy(
        peril_type=peril,
        trigger_description="test condition",
        data_source_hint=hint,
        premium=u256(premium),
        payout=u256(payout),
        coverage_start=u256(start),
        coverage_end=u256(end),
    )
    env.warp(1500)
    env.prank(buyer, value=premium)
    contract.buy_policy(pid)
    env.warp(3500)
    return pid


def test_resolve_inconclusive_when_web_source_unavailable(env, contract):
    """
    When the web fetch for a URL hint fails, resolve_policy must raise
    UserError (inconclusive), leave status as 'resolution_inconclusive',
    and must NOT transfer any funds.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    # Simulate the data source being unreachable
    env.web_fetch_fails = True
    env.transfers.clear()

    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolution_inconclusive", (
        f"Expected 'resolution_inconclusive', got '{policy.status}'"
    )
    assert "SOURCE_UNAVAILABLE" in (policy.resolution_justification or "")
    # No money must have moved
    assert env.transfers == [], "Transfer must not occur when resolution is inconclusive"


def test_resolve_inconclusive_when_source_returns_error_or_empty(env, contract):
    """
    When the data source returns an error payload (e.g. 404, 500) or an empty body,
    source evidence is unavailable and resolution must remain inconclusive without transfers.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    env.mock_web_response = "404 Not Found: requested telemetry station does not exist."
    env.transfers.clear()

    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolution_inconclusive"
    assert "SOURCE_UNAVAILABLE" in (policy.resolution_justification or "")
    assert env.transfers == []


def test_resolve_inconclusive_when_hint_empty(env, contract):
    """
    When data_source_hint is empty, source evidence cannot be obtained
    and resolution must fail as inconclusive.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    pid = _make_purchased_policy(env, contract, underwriter, buyer, hint="")

    env.transfers.clear()
    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolution_inconclusive"
    assert "SOURCE_UNAVAILABLE" in (policy.resolution_justification or "")
    assert env.transfers == []


def test_resolve_inconclusive_when_llm_unavailable(env, contract):
    """
    When the LLM call fails (and no exec_prompt fallback exists), resolve_policy
    must raise UserError (inconclusive), leave status as 'resolution_inconclusive',
    and must NOT transfer any funds.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    env.mock_web_response = "Open-Meteo ERA5: rainfall recorded 12.5mm"
    env.llm_fails = True
    if hasattr(gl.nondet, "exec_prompt"):
        gl.nondet.exec_prompt = None
    env.transfers.clear()

    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolution_inconclusive", (
        f"Expected 'resolution_inconclusive', got '{policy.status}'"
    )
    assert "MODEL_UNAVAILABLE" in (policy.resolution_justification or "")
    assert env.transfers == [], "Transfer must not occur when resolution is inconclusive"


def test_resolve_inconclusive_when_llm_returns_malformed_json(env, contract):
    """
    When the LLM produces a non-JSON or malformed response, validator evaluation
    must not guess a boolean outcome; resolution must be inconclusive.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    env.mock_web_response = "Weather station telemetry records valid rainfall metrics"
    env.mock_llm_response = "I cannot determine this condition because the prompt was confusing."
    env.transfers.clear()

    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolution_inconclusive"
    assert "MODEL_UNPARSEABLE" in (policy.resolution_justification or "")
    assert env.transfers == []


def test_resolve_inconclusive_when_llm_returns_non_boolean_verdict(env, contract):
    """
    When the LLM explicitly returns null or inconclusive verdict in triggered field,
    the contract must reject conclusive resolution and prevent fund movement.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    env.mock_web_response = "Flight telemetry: Flight delayed indefinitely due to ATC ground stop."
    env.mock_llm_response = '{"triggered": null, "justification": "Indefinite delay without official final landing timestamp prevents conclusive determination."}'
    env.transfers.clear()

    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolution_inconclusive"
    assert "MODEL_INCONCLUSIVE" in (policy.resolution_justification or "")
    assert env.transfers == []


def test_resolve_inconclusive_can_be_retried_and_resolved_once_evidence_available(env, contract):
    """
    A policy whose initial resolution was inconclusive due to temporary data/model
    unavailability can be retried and conclusively resolved once valid evidence is available.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    payout = 1000

    pid = _make_purchased_policy(env, contract, underwriter, buyer, payout=payout)

    # First attempt: web fetch fails
    env.web_fetch_fails = True
    env.transfers.clear()
    with pytest.raises(ValueError, match="resolution inconclusive"):
        contract.resolve_policy(pid)

    assert contract.get_policy(pid).status == "resolution_inconclusive"
    assert env.transfers == []

    # Second attempt: web source recovers and provides conclusive data
    env.web_fetch_fails = False
    env.mock_web_response = "Open-Meteo ERA5: Total rainfall 4.2mm (under 10mm threshold)"
    env.mock_llm_response = '{"triggered": true, "justification": "Rainfall of 4.2mm confirmed below 10mm threshold."}'

    contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "resolved_triggered"
    assert len(env.transfers) == 1
    assert env.transfers[0]["recipient"] == buyer
    assert env.transfers[0]["amount"] == payout


def test_payout_transfer_failure_does_not_advance_status(env, contract):
    """
    When the payout transfer to the buyer fails, the policy status must
    NOT advance to 'resolved_triggered'.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    env.mock_web_response = "precipitation 3mm, below threshold"
    env.mock_llm_response = '{"triggered": true, "justification": "Threshold breached per telemetry."}'

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    # Make transfers fail at the ledger level
    env.transfer_fails = True
    env.transfers.clear()

    with pytest.raises(Exception, match="Payout transfer"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status != "resolved_triggered", (
        "Status must not advance to 'resolved_triggered' when transfer failed"
    )
    assert env.transfers == []


def test_refund_transfer_failure_does_not_advance_status(env, contract):
    """
    When the refund transfer to the underwriter fails, the policy status must
    NOT advance to 'resolved_not_triggered'.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"

    env.mock_web_response = "flight on time, delay 5 minutes"
    env.mock_llm_response = '{"triggered": false, "justification": "Delay under threshold."}'

    pid = _make_purchased_policy(env, contract, underwriter, buyer)

    env.transfer_fails = True
    env.transfers.clear()

    with pytest.raises(Exception, match="Refund transfer"):
        contract.resolve_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status != "resolved_not_triggered", (
        "Status must not advance to 'resolved_not_triggered' when transfer failed"
    )
    assert env.transfers == []


def test_expiry_transfer_failure_does_not_advance_status(env, contract):
    """
    When the collateral-refund transfer in expire_unsold_policy fails, the
    policy status must NOT advance to 'expired'.
    """
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    payout = 800
    start = 2000
    end = 3000

    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy(
        "flight_delay", "BA456 cancel", "https://flightstats.com",
        u256(40), u256(payout), u256(start), u256(end)
    )

    # Advance time past coverage_start so expiry is valid
    env.warp(2100)
    env.transfer_fails = True
    env.transfers.clear()

    with pytest.raises(Exception, match="Expiry collateral refund"):
        contract.expire_unsold_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status != "expired", (
        "Status must not advance to 'expired' when transfer failed"
    )
    assert env.transfers == []
