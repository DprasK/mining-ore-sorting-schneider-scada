# Validation Report — Compile-Safe Recovery

File: `PLC/MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp`

- XML parse: PASS
- Controller: `TM221CE24R`
- POU: `ORE_SORTING_28R_IL`
- Rungs: 28
- Instruction lines: 112
- CPU inputs/outputs: 14/10
- Memory bits: 17
- Timers: 2
- Counters: 3
- Counter input order corrected in UI rungs 16, 17, 18: reset R precedes count CU.
- Referenced `%I/%Q/%M/%TM/%C` objects: 36
- Undefined object references: 0
- First-scan presets are retained. They were NOT the cause of the compilation error: the documented legal preset range is 0 to 9999.

## Machine Expert Basic load test

- Application version: 1.4.0.484
- `End load file`: PASS at 2026-09-06 17:52:04 local time
- `Validation of type All completed`: PASS at 2026-09-06 17:52:10 local time
- Direct GUI verification: global status `No error`; Programming tab has no error marker; UI rungs 16, 17, and 18 show green check marks.
- Before/after comparison: COUNTERS_FIXED shows `Program error(s) detected` and red marks on those three rungs; COUNTER_ORDER shows `No error` after changing only their instruction ordering (plus the file path).
- Application process remained responsive.

This recovery file replaces the generated 53-rung program as the package's main PLC file. The earlier file could load but still produced multiple Analyze errors; it is intentionally not claimed as compile-ready.

Reference: Schneider Electric EIO0000001474.07, page 169, counter programming example: https://www.proface.com/sites/default/files/2020/download/EIO0000001474.07.pdf

This verifies program validation, not runtime sequence correctness or the separate Modbus TCP connection. Those remain commissioning checks.
