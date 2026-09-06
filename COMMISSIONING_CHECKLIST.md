# Commissioning Checklist — Ore Sorting Recovery Project

## Analyze

- Open `PLC/MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp`.
- Run **Analyze** and require zero errors before starting the simulator.
- Controller must be `TM221CE24R`; verify 14 CPU inputs and 10 CPU outputs.
- Confirm `%I0.0…%I0.7`, `%Q0.0…%Q0.5`, `%M0…%M40`, `%TM0/%TM1`, and `%C0…%C2` against the symbol table.

## Sequence

- Verify safety chain: STOP, E-stop, overload, and diverter-home feedback.
- Test manual and automatic run demand separately.
- Trigger XRF classification for high-grade, medium-grade, and reject ore.
- Confirm only one classification latch is active for each parcel.
- Verify conveyor transport delay and pneumatic-diverter dwell time.
- Confirm the matching production counter increments once per parcel.
- Test sequence reset, counter reset, reject-bin-full interlock, run lamp, and alarm lamp.

## Schneider simulator

- Start only the official simulator from Machine Expert Basic.
- Connect/login and place the simulated controller in RUN.
- Do not use the web SCADA control mode until monitor-only reads have been verified.
- STOP from SCADA is an operational command, not an emergency-stop function.
