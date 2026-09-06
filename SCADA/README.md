# Mining Ore Sorting Web SCADA — Schneider M221

SCADA ini tidak memiliki simulator proses buatan. Semua status dashboard berasal dari coil `%M` pada Schneider Machine Expert - Basic simulator atau PLC M221 melalui Modbus TCP.

## Menjalankan dengan Schneider emulator

1. Buka `../PLC/MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp` di EcoStruxure Machine Expert - Basic.
2. Jalankan **Analyze/Compile**.
3. Start simulator Schneider, login bila diminta, lalu ubah controller ke **RUN**.
4. Pastikan emulator mendengarkan pada `127.0.0.1:502`, Unit ID `1`.
5. Klik `Jalankan_SCADA_MONITOR.cmd` untuk pengujian read-only.
6. Buka `http://127.0.0.1:3200` dan pastikan status berubah menjadi **SCHNEIDER ONLINE**.
7. Setelah pembacaan terbukti benar, hentikan monitor lalu klik `Jalankan_SCADA_CONTROL_SCHNEIDER.cmd` untuk mengaktifkan kontrol.
8. Masukkan token acak dari terminal melalui tombol **CONTROL SESSION**.

Tidak ada fallback ke nilai simulasi. Jika port 502 tidak tersedia, project belum RUN, atau respons Modbus gagal, dashboard tetap menampilkan `PLC OFFLINE / NO DATA`.

## Pemetaan Modbus

M221 memakai protocol offset berbasis nol: `%M0` adalah coil offset `0`.

| Kelompok | Alamat PLC | Offset Modbus | Akses |
|---|---:|---:|---|
| Auto mode | `%M0` | `0` | Whitelist R/W |
| Start / Stop | `%M1/%M2` | `1/2` | Whitelist R/W |
| Auto enable | `%M3` | `3` | Whitelist R/W |
| System and safety | `%M10/%M11` | `10/11` | Read only |
| Reject-bin interlock | `%M14` | `14` | Read only |
| Grade classification | `%M20…%M22` | `20…22` | Read only |
| Sorting/diverter status | `%M23/%M24` | `23/24` | Read only |
| Common alarm | `%M30` | `30` | Read only |
| Reset counters | `%M40` | `40` | Whitelist R/W |

SCADA membaca FC01 dan menulis FC05 dengan readback. Tidak ada endpoint untuk menulis alamat arbitrer.

## Keamanan

- Web server hanya bind ke `127.0.0.1`.
- Mode default adalah monitor-only.
- Mode kontrol membutuhkan token acak minimal 20 karakter yang dibuat ulang pada setiap start.
- Same-origin check, rate limit, payload limit, dan audit log diterapkan.
- Port 502 dan web SCADA tidak boleh diekspos langsung ke internet.
- STOP web adalah kontrol operasional, bukan emergency stop.

## Verifikasi source

```powershell
npm run check
npm test
```
