import pytest
from contracts.parametric_guard import ParametricGuard, Policy, gl, u256, Address


class MockEnvironment:
    """Simulates the GenLayer VM Direct-Mode execution context."""
    def __init__(self):
        self.sender = "0xUnderwriter11111111111111111111111111111111"
        self.value = 0
        self.timestamp = 1000
        self.transfers = []

        # Hook into gl
        gl.message.sender = self.sender
        gl.message.value = self.value
        gl.message.timestamp = self.timestamp
        gl.transfer = self._mock_transfer

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


@pytest.fixture
def env():
    return MockEnvironment()


@pytest.fixture
def contract(env):
    return ParametricGuard()


def test_create_policy_locks_collateral_and_status_open(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    payout = 1000
    premium = 50
    start = 2000
    end = 3000

    # Underwriter attempts to create policy without collateral -> should fail
    env.prank(underwriter, value=0)
    with pytest.raises(ValueError, match="Underwriter collateral required"):
        contract.create_policy(
            peril_type="weather",
            trigger_description="rainfall < 10mm in Lagos, Jun 1-30 2026",
            data_source_hint="https://weather.open-meteo.com/v1/forecast",
            premium=u256(premium),
            payout=u256(payout),
            coverage_start=u256(start),
            coverage_end=u256(end)
        )

    # Underwriter provides exact collateral -> succeeds
    env.prank(underwriter, value=payout)
    pid = contract.create_policy(
        peril_type="weather",
        trigger_description="rainfall < 10mm in Lagos, Jun 1-30 2026",
        data_source_hint="https://weather.open-meteo.com/v1/forecast",
        premium=u256(premium),
        payout=u256(payout),
        coverage_start=u256(start),
        coverage_end=u256(end)
    )

    assert pid == u256(1)
    policy = contract.get_policy(pid)
    assert policy.status == "open"
    assert policy.underwriter == Address(underwriter)
    assert policy.buyer is None
    assert policy.payout == u256(payout)
    assert policy.premium == u256(premium)
    assert policy.coverage_start == u256(start)
    assert policy.coverage_end == u256(end)


def test_buy_policy_succeeds_before_start_and_fails_after(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    payout = 1000
    premium = 50
    start = 2000
    end = 3000

    env.prank(underwriter, value=payout)
    pid = contract.create_policy("flight_delay", "DL123 delayed > 120m", "flightaware.com", u256(premium), u256(payout), u256(start), u256(end))

    # Buyer attempts to buy after coverage_start has already arrived
    env.warp(2500)
    env.prank(buyer, value=premium)
    with pytest.raises(ValueError, match="Coverage window already started"):
        contract.buy_policy(pid)

    # Reset time to before coverage_start (1500 < 2000)
    env.warp(1500)
    
    # Buyer sends wrong premium -> fails
    env.prank(buyer, value=30)
    with pytest.raises(ValueError, match="Incorrect premium sent"):
        contract.buy_policy(pid)

    # Buyer sends exact premium -> succeeds
    env.prank(buyer, value=premium)
    contract.buy_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "purchased"
    assert policy.buyer == Address(buyer)


def test_buy_policy_fails_if_already_purchased(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer1 = "0xBuyer1111111111111111111111111111111111111111"
    buyer2 = "0xBuyer2222222222222222222222222222222222222222"

    env.warp(1000)
    env.prank(underwriter, value=1000)
    pid = contract.create_policy("weather", "drought in Nairobi", "open-meteo.com", u256(50), u256(1000), u256(2000), u256(3000))

    env.prank(buyer1, value=50)
    contract.buy_policy(pid)

    # Second buyer attempts to buy already-purchased policy
    env.prank(buyer2, value=50)
    with pytest.raises(ValueError, match="Policy is not open for purchase"):
        contract.buy_policy(pid)


def test_resolve_policy_reverts_if_called_before_coverage_end(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    start = 2000
    end = 3000

    env.warp(1000)
    env.prank(underwriter, value=1000)
    pid = contract.create_policy("weather", "flood in Valencia", "weather.com", u256(50), u256(1000), u256(start), u256(end))

    # Try to resolve before purchase -> fails
    env.warp(3500)
    with pytest.raises(ValueError, match="status is 'open', expected 'purchased'"):
        contract.resolve_policy(pid)

    # Purchase policy
    env.warp(1500)
    env.prank(buyer, value=50)
    contract.buy_policy(pid)

    # Try to resolve while coverage is still active (2500 < 3000) -> reverts
    env.warp(2500)
    with pytest.raises(ValueError, match="Coverage window has not ended yet"):
        contract.resolve_policy(pid)


def test_expire_unsold_policy_returns_collateral_correctly(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    buyer = "0xBuyer2222222222222222222222222222222222222222"
    payout = 800
    start = 2000
    end = 3000

    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy("flight_delay", "BA456 cancel", "flightstats.com", u256(40), u256(payout), u256(start), u256(end))

    # Cannot expire before coverage_start (1500 < 2000)
    env.warp(1500)
    with pytest.raises(ValueError, match="Coverage has not started yet"):
        contract.expire_unsold_policy(pid)

    # Once coverage_start passes (2100 >= 2000), underwriter reclaims collateral
    env.warp(2100)
    contract.expire_unsold_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "expired"
    # Check that payout was transferred back to underwriter
    assert any(t["recipient"] == underwriter and t["amount"] == payout for t in env.transfers)

    # Purchased policy cannot be expired
    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid2 = contract.create_policy("weather", "snow in Tokyo", "jma.go.jp", u256(40), u256(payout), u256(start), u256(end))
    env.prank(buyer, value=40)
    contract.buy_policy(pid2)

    env.warp(2500)
    with pytest.raises(ValueError, match="Policy is not open"):
        contract.expire_unsold_policy(pid2)


def test_expire_unsold_policy_reverts_if_transfer_fails(env, contract):
    underwriter = "0xUnderwriter11111111111111111111111111111111"
    payout = 800
    start = 2000
    end = 3000

    env.warp(1000)
    env.prank(underwriter, value=payout)
    pid = contract.create_policy("flight_delay", "BA456 cancel", "flightstats.com", u256(40), u256(payout), u256(start), u256(end))

    env.warp(2100)
    def failing_transfer(recipient, amount):
        raise RuntimeError("Ledger rejected transfer")
    gl.transfer = failing_transfer

    with pytest.raises(Exception, match="Expiry collateral refund"):
        contract.expire_unsold_policy(pid)

    policy = contract.get_policy(pid)
    assert policy.status == "open", "Policy status must not change if expiry transfer fails"
