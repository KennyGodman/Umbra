#!/usr/bin/env python3
"""
Deployment script for ParametricGuard on GenLayer.
Executes real on-chain deployment and policy seeding via GenLayer SDK.
"""

import json
import os
import subprocess
import sys

DEPLOY_SCRIPT_CJS = os.path.abspath(os.path.join(os.path.dirname(__file__), "deploy.cjs"))
DEPLOYMENTS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts", "deployments.json"))


def deploy_contract():
    print("==================================================")
    print("[*] Launching GenLayer On-Chain Deployment...")
    print(f"[*] Script: {DEPLOY_SCRIPT_CJS}")
    print("==================================================")

    res = subprocess.run(["node", DEPLOY_SCRIPT_CJS], check=True)
    if res.returncode != 0:
        print("[!] Deployment failed with code", res.returncode)
        sys.exit(res.returncode)

    if os.path.exists(DEPLOYMENTS_FILE):
        with open(DEPLOYMENTS_FILE, "r") as f:
            data = json.load(f)
            print(f"\n[OK] ParametricGuard successfully deployed at: {data.get('contract_address')}")
            return data
    return {}


if __name__ == "__main__":
    deploy_contract()
