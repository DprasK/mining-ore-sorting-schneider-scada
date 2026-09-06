@echo off
setlocal
set "MEB_EXE=E:\Aplikasi\EcoStruxure Machine Expert - Basic\SchneiderElectric.SoMachineBasic.MainApplication.exe"
set "PROJECT=%~dp0PLC\MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp"

if not exist "%MEB_EXE%" (
  echo EcoStruxure Machine Expert Basic tidak ditemukan di:
  echo %MEB_EXE%
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
