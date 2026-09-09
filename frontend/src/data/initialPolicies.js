export const INITIAL_POLICIES = [
  {
    policy_id: 1,
    underwriter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    buyer: null,
    peril_type: "weather",
    trigger_description: "Accumulated rainfall < 10mm in Lagos, Nigeria during observation window",
    data_source_hint: "https://archive-api.open-meteo.com/v1/era5?latitude=6.5244&longitude=3.3792&daily=precipitation_sum",
    premium: 35,
    payout: 500,
    coverage_start: Math.floor(Date.now() / 1000) + 20, // starts in 20s
    coverage_end: Math.floor(Date.now() / 1000) + 120, // ends in 2m
    status: "open",
    resolution_justification: null
  },
  {
    policy_id: 2,
    underwriter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    buyer: null,
    peril_type: "flight_delay",
    trigger_description: "Delta flight DL123 arrival delay exceeds 120 minutes at ATL airport",
    data_source_hint: "https://flightaware.com/live/flight/DAL123",
    premium: 50,
    payout: 800,
    coverage_start: Math.floor(Date.now() / 1000) + 40, // starts in 40s
    coverage_end: Math.floor(Date.now() / 1000) + 180, // ends in 3m
    status: "open",
    resolution_justification: null
  },
  {
    policy_id: 3,
    underwriter: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    buyer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    peril_type: "weather",
    trigger_description: "Maximum surface temperature > 38°C in Seville, Spain between 12:00-18:00 UTC",
    data_source_hint: "https://weather.open-meteo.com/v1/forecast?latitude=37.3891&longitude=-5.9845&hourly=temperature_2m",
    premium: 60,
    payout: 900,
    coverage_start: Math.floor(Date.now() / 1000) - 300,
    coverage_end: Math.floor(Date.now() / 1000) - 60, // ended 1 minute ago!
    status: "purchased", // Ready for instant live resolution!
    resolution_justification: null
  },
  {
    policy_id: 4,
    underwriter: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    buyer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    peril_type: "flight_delay",
    trigger_description: "British Airways BA249 delay > 90 minutes London Heathrow to Rio de Janeiro",
    data_source_hint: "https://api.flightstats.com/flex/flightstatus/rest/v2/json/flight/status/BA/249",
    premium: 45,
    payout: 650,
    coverage_start: Math.floor(Date.now() / 1000) - 7200,
    coverage_end: Math.floor(Date.now() / 1000) - 3600,
    status: "resolved_triggered",
    resolution_justification: "Validators verified FlightStats telemetry confirming BA249 departed LHR at 15:45 (scheduled 13:20) and touched down in GIG with 114 minutes delay, satisfying the >90 min trigger threshold. Payout of 650 GEN executed to buyer."
  },
  {
    policy_id: 5,
    underwriter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    buyer: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    peril_type: "weather",
    trigger_description: "Wind gust velocity > 75 km/h recorded in Miami Beach during Tropical Storm notice",
    data_source_hint: "https://api.weather.gov/stations/KMIA/observations",
    premium: 80,
    payout: 1200,
    coverage_start: Math.floor(Date.now() / 1000) - 14400,
    coverage_end: Math.floor(Date.now() / 1000) - 7200,
    status: "resolved_not_triggered",
    resolution_justification: "NOAA National Weather Service station KMIA logged peak sustained gusts of 54 km/h during the observation period. 75 km/h threshold not met. Locked payout of 1200 GEN and 80 GEN premium returned to underwriter."
  }
];
