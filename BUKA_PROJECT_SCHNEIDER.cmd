@echo off
setlocal
set "PROJECT=%~dp0PLC\MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp"

if defined MEB_EXE if exist "%MEB_EXE%" goto meb_found
set "MEB_EXE="

for %%P in (
  "%ProgramFiles%\Schneider Electric\EcoStruxure Machine Expert - Basic\SchneiderElectric.SoMachineBasic.MainApplication.exe"
  "%ProgramFiles(x86)%\Schneider Electric\EcoStruxure Machine Expert - Basic\SchneiderElectric.SoMachineBasic.MainApplication.exe"
  "%ProgramFiles%\Schneider Electric\SoMachine Basic\SchneiderElectric.SoMachineBasic.MainApplication.exe"
  "%ProgramFiles(x86)%\Schneider Electric\SoMachine Basic\SchneiderElectric.SoMachineBasic.MainApplication.exe"
) do if not defined MEB_EXE if exist "%%~P" set "MEB_EXE=%%~P"

if defined MEB_EXE goto meb_found
for /f "delims=" %%I in ('where SchneiderElectric.SoMachineBasic.MainApplication.exe 2^>nul') do if not defined MEB_EXE set "MEB_EXE=%%~fI"

:meb_found
if not defined MEB_EXE (
  echo EcoStruxure Machine Expert Basic tidak ditemukan.
  echo Set variabel MEB_EXE ke lokasi file SchneiderElectric.SoMachineBasic.MainApplication.exe,
  echo lalu jalankan launcher ini kembali.
  pause
  exit /b 1
)

if not exist "%PROJECT%" (
  echo File project tidak ditemukan:
  echo %PROJECT%
  pause
  exit /b 1
)

start "" "%MEB_EXE%" "%PROJECT%"
exit /b 0
