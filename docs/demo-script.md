# ParametricGuard — Live Hackathon Demo Script

Track: **Prediction Markets & Real-World Settlement**  
Network: **GenLayer Testnet**  
Core Innovation: **Autonomous, Non-Deterministic Validator Consensus via `gl.eq_principle.prompt_non_comparative`**

---

## Demo Overview (2-3 Minutes)

ParametricGuard redefines parametric insurance by eliminating bureaucratic claims adjusters. Instead, GenLayer validators independently fetch real-world data from the web, evaluate the plain-English trigger conditions using peril-tailored prompts, reach consensus using non-comparative semantic equivalence, and instantly pay out or release collateral.

---

## Step-by-Step Presentation Script

### 1. The Landing Page & Intro (15s)
- **Visual**: Show the calm blue/slate landing page with the protection motif (shield/umbrella).
- **Say**: *"Traditional insurance requires lengthy claims forms, subjective human adjusters, and weeks of delay. ParametricGuard brings automated real-world settlement to GenLayer: policy conditions are resolved directly by AI validators connected to the live web."*
- **Action**: Click **"Launch DApp"**. Watch the rolling shield/umbrella logo transition into the application.

### 2. Marketplace & Peril Diversity (30s)
- **Visual**: Marketplace showcasing open policies across **Weather** and **Flight Delay**.
- **Demonstrate**:
  - Filter by peril type (`Weather`, `Flight Delay`, or `All`).
  - Sort by premium, payout, or coverage window.
  - Highlight the transparent policy cards showing the trigger condition in plain English, payout multiplier, and data source hint.
- **Say**: *"Underwriters create policies by locking 1:1 collateral into the contract. Every policy explicitly specifies the plain-English trigger and the exact real-world data source validators will verify."*

### 3. Purchasing Coverage (Buyer Flow) (20s)
- **Action**: Click **"Buy Coverage"** on Policy #1 (e.g., Weather: *Accumulated rainfall < 10mm in Lagos*).
- **Visual**: Buy confirmation modal displays premium, payout, and coverage window.
- **Action**: Click **"Confirm & Pay Premium"**.
- **Say**: *"The buyer pays the exact premium before the coverage window starts. The policy transitions to 'purchased' state. Funds are held trustlessly in the contract."*

### 4. Coverage Window & Live Resolution (Peril 1 — Weather) (45s)
- **Action**: Navigate to **"My Policies"**.
- **Visual**: Show the countdown timer reaching zero as the coverage window closes.
- **Action**: Click the active **"Resolve Now"** button.
- **Visual**: Show the **Live Validator Consensus Animation**:
  1. *Validator Selection*: Assigning decentralized nodes.
  2. *Web Data Retrieval*: Fetching actual rainfall observations from the Open-Meteo ERA5 weather API.
  3. *Equivalence Consensus*: Validators running `prompt_non_comparative` to agree that 6.4mm rainfall satisfies the `< 10mm` condition.
  4. *Instant Settlement*: Automatic release of the 500 GEN payout to the buyer.
- **Highlight**: Open the **Resolution Justification Card**. Read the on-chain justification citing the specific millimeters recorded and the data source.
- **Say**: *"Notice this on-chain justification: resolution isn't a black box. The validators recorded their exact findings and reasoning directly onto the chain."*

### 5. Generalizing to Peril 2 (Flight Delay — Not Triggered Scenario) (30s)
- **Visual**: Switch to Policy #2 (Flight Delay: *Delta DL123 delay > 120 mins*).
- **Action**: Resolve the flight delay policy.
- **Visual**:
  - Validators query FlightAware logs.
  - Data indicates the flight arrived with only a 15-minute delay.
  - Validators reach consensus that the trigger was **NOT met**.
  - Collateral (payout) + earned premium are instantly returned to the underwriter!
- **Say**: *"Here, the condition was not met. The contract automatically returns the underwriter's collateral plus the earned premium—proving full bidirectional settlement without human intervention."*

### 6. Underwriter Dashboard & Policy Creation (20s)
- **Action**: Navigate to **"Underwriter Dashboard"** and **"Create Policy"**.
- **Demonstrate**:
  - Show the live policy preview updating in real-time as you type.
  - Show the prominent collateral lock notice: *"You will lock {payout} GEN to create this policy"*.
  - Show the "Reclaim Collateral" feature for expired unsold policies.
- **Wrap Up**: *"ParametricGuard demonstrates the power of GenLayer: smart contracts that don't just compute numbers, but perceive and settle against the real world."*
