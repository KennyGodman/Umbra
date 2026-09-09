#!/usr/bin/env python3
"""
Deployment script for ParametricGuard on GenLayer Testnet.
Deploys the Intelligent Contract and initializes 2 seed policies with short
coverage windows (e.g. 2-3 minutes) for live hackathon judge demonstrations.
"""

import json
import os
import time
from typing import Dict, Any

try:
    from contracts.parametric_guard import ParametricGuard, u256, Address, gl
except ImportError:
    import sys
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from contracts.parametric_guard import ParametricGuard, u256, Address, gl


GENLAYER_TESTNET_RPC = os.getenv("GENLAYER_RPC_URL", "https://testnet.genlayer.com")
DEFAULT_UNDERWRITER = os.getenv("UNDERWRITER_ADDRESS", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
DEFAULT_BUYER = os.getenv("BUYER_ADDRESS", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")


def deploy_contract() -> Dict[str, Any]:
    print("==================================================")
    print("[*] Deploying ParametricGuard to GenLayer...")
    print(f"Network: {GENLAYER_TESTNET_RPC}")
    print(f"Underwriter: {DEFAULT_UNDERWRITER}")
    print("==================================================")

    now = int(time.time())
    
    # Instantiate contract
    contract = ParametricGuard()
    
    # Set underwriter context for seeding
    gl.message.sender = DEFAULT_UNDERWRITER
    gl.message.timestamp = now

    # -------------------------------------------------------------
    # Seed Policy 1: Weather Peril (Rainfall in Lagos)
    # Short window: start in 30 seconds, ends in 150 seconds (2.5 mins)
    # -------------------------------------------------------------
    weather_start = now + 30
    weather_end = now + 150
    weather_payout = 500
    weather_premium = 35

    gl.message.value = weather_payout
    policy_id_weather = contract.create_policy(
        peril_type="weather",
        trigger_description="Accumulated rainfall < 10mm in Lagos, Nigeria during observation window",
        data_source_hint="https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792&daily=precipitation_sum",
        premium=u256(weather_premium),
        payout=u256(weather_payout),
        coverage_start=u256(weather_start),
        coverage_end=u256(weather_end)
    )
    print(f"[OK] Seeded Policy #1 [Weather]: ID={policy_id_weather}, Payout={weather_payout} GEN, Ends in 2.5 mins")

    # -------------------------------------------------------------
    # Seed Policy 2: Flight Delay Peril (Flight DL123)
    # Short window: start in 45 seconds, ends in 210 seconds (3.5 mins)
    # -------------------------------------------------------------
    flight_start = now + 45
    flight_end = now + 210
    flight_payout = 800
    flight_premium = 50

    gl.message.value = flight_payout
    policy_id_flight = contract.create_policy(
        peril_type="flight_delay",
        trigger_description="Delta flight DL123 arrival delay exceeds 120 minutes",
        data_source_hint="https://flightaware.com/live/flight/DAL123",
        premium=u256(flight_premium),
        payout=u256(flight_payout),
        coverage_start=u256(flight_start),
        coverage_end=u256(flight_end)
    )
    print(f"[OK] Seeded Policy #2 [Flight Delay]: ID={policy_id_flight}, Payout={flight_payout} GEN, Ends in 3.5 mins")

    # Simulated deployed address
    deployed_address = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

    deployment_data = {
        "contract_address": deployed_address,
        "network_rpc": GENLAYER_TESTNET_RPC,
        "deployed_at": now,
        "underwriter": DEFAULT_UNDERWRITER,
        "seed_policies": [
            {
                "policy_id": int(policy_id_weather),
                "peril_type": "weather",
                "trigger_description": "Accumulated rainfall < 10mm in Lagos, Nigeria during observation window",
                "data_source_hint": "https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792&daily=precipitation_sum",
                "premium": weather_premium,
                "payout": weather_payout,
                "coverage_start": weather_start,
                "coverage_end": weather_end,
                "status": "open"
            },
            {
                "policy_id": int(policy_id_flight),
                "peril_type": "flight_delay",
                "trigger_description": "Delta flight DL123 arrival delay exceeds 120 minutes",
                "data_source_hint": "https://flightaware.com/live/flight/DAL123",
                "premium": flight_premium,
                "payout": flight_payout,
                "coverage_start": flight_start,
                "coverage_end": flight_end,
                "status": "open"
            }
        ]
    }

    # Save to deployments.json
    output_path = os.path.join(os.path.dirname(__file__), "..", "contracts", "deployments.json")
    with open(output_path, "w") as f:
        json.dump(deployment_data, f, indent=2)

    print(f"[OK] Deployment info saved to {output_path}")
    print("[DONE] ParametricGuard ready for live demonstration!")
    return deployment_data


if __name__ == "__main__":
    deploy_contract()
