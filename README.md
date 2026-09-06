# Mining Ore Sorting Plant — Schneider M221 + Web SCADA

Paket ini berisi proyek EcoStruxure Machine Expert - Basic yang sudah diuji buka langsung pada instalasi Machine Expert Basic 1.4, beserta SCADA web lokal yang membaca dan mengontrol memory bit M221 melalui Modbus TCP.

## File utama

- Launcher project: `BUKA_PROJECT_SCHNEIDER.cmd`
- PLC utama: `PLC/MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp`
- SCADA: `SCADA/Jalankan_SCADA_MONITOR.cmd`
- SCADA control: `SCADA/Jalankan_SCADA_CONTROL_SCHNEIDER.cmd`

## Proses industri

- Conveyor analyser bijih dengan klasifikasi XRF tiga jalur.
- Jalur high-grade, medium-grade, dan reject memakai pneumatic diverter terpisah.
- Sequence transport-ke-diverter, dwell timer, latch parcel, dan reset otomatis.
- Mode auto/manual, safety summary, reject-bin interlock, alarm, dan tiga production counter.

## Hardware

- Controller `TM221CE24R`.
- Expansion DI `TM3DI32K` disediakan sebagai spare instrumentation.
- Expansion AI `TM3AI2H/G` dengan satu channel 4–20 mA cadangan.
- POU Instruction List: `ORE_SORTING_28R_IL`.
- 28 rung dan 112 instruction lines, termasuk first-scan preset `%C0…%C2`.

## Status openability

File utama berisi 28 rung. Urutan input tiga blok counter pada rung UI 16–18 diperbaiki menjadi reset R sebelum CU, mengikuti contoh Schneider. Verifikasi langsung pada Machine Expert Basic 1.4.0.484 menunjukkan status `No error` dan tanda centang hijau pada ketiga rung tersebut. File sebelumnya berakhiran `COUNTERS_FIXED` masih memiliki error; gunakan `COUNTER_ORDER`.

## Urutan penggunaan

1. Klik `BUKA_PROJECT_SCHNEIDER.cmd`; file `COUNTER_ORDER.smbp` telah diperiksa langsung dan menunjukkan `No error` di Machine Expert Basic.
2. Start simulator resmi Schneider dan ubah controller ke RUN.
3. Jalankan SCADA monitor-only terlebih dahulu.
4. Pastikan dashboard menunjukkan `SCHNEIDER ONLINE`.
5. Gunakan launcher control hanya setelah mapping dan interlock diperiksa.

Tidak ada simulator proses buatan di dalam SCADA. Saat Schneider emulator tidak terhubung, dashboard akan tetap OFFLINE tanpa data fallback.
