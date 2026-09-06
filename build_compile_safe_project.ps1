param(
    [string]$OutputPath = (Join-Path $PSScriptRoot 'PLC\MINING_ORE_SORTING_TM221CE24R_COUNTER_ORDER.smbp')
)

$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path $PSScriptRoot -Parent
$logicSource = Join-Path $workspaceRoot 'sortir conveyor - IL lengkap.smbp'
$hardwareSource = Join-Path $workspaceRoot 'Schneider_Conveyor_IL_M221\V4_Sortir_3_Jalur\SORTING_3_WAY_TM221CE24R_REV3_VERIFIED.smbp'

# Keep the manually authored 27-rung IL program intact. Only project metadata,
# symbols/comments, and the complete known-openable TM221CE24R hardware tree are
# changed. This avoids the generated 53-rung instruction set that failed compile.
[xml]$doc = Get-Content -Raw -LiteralPath $logicSource
[xml]$hardwareDoc = Get-Content -Raw -LiteralPath $hardwareSource

$importedHardware = $doc.ImportNode($hardwareDoc.ProjectDescriptor.HardwareConfiguration, $true)
[void]$doc.ProjectDescriptor.ReplaceChild($importedHardware, $doc.ProjectDescriptor.HardwareConfiguration)

$fullOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path $fullOutputPath -Parent
if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$doc.ProjectDescriptor.Name = 'MINING_ORE_SORTING_COMPILE_SAFE'
$doc.ProjectDescriptor.FullName = $fullOutputPath
$pou = $doc.ProjectDescriptor.SoftwareConfiguration.Pous.ProgramOrganizationUnits
$pou.Name = 'ORE_SORTING_28R_IL'
$doc.ProjectDescriptor.HardwareConfiguration.Plc.Cpu.Name = 'ORE_SORTING_M221'

# Machine Expert Basic numbers rungs from zero. UI rungs 15, 16, and 17
# are the %C0, %C1, and %C2 production counter blocks. Initialize their
# presets once on first scan so all three blocks have a valid target value.
$templateRung = @($pou.Rungs.RungEntity)[0]
$presetRung = $templateRung.CloneNode($true)
$presetRung.Name = 'N00_PRODUCTION_COUNTER_PRESETS'
$presetRung.MainComment = 'First scan: initialize high, medium, and reject production counter presets.'
$instructionLinesNode = $presetRung.SelectSingleNode('InstructionLines')
$instructionLinesNode.RemoveAll()
foreach ($instruction in 'LD  %S13','[ %C0.P := 9999 ]','[ %C1.P := 9999 ]','[ %C2.P := 9999 ]') {
    $entity = $doc.CreateElement('InstructionLineEntity')
    $line = $doc.CreateElement('InstructionLine')
    $line.InnerText = $instruction
    [void]$entity.AppendChild($line)
    [void]$entity.AppendChild($doc.CreateElement('Comment'))
    [void]$instructionLinesNode.AppendChild($entity)
}
[void]$pou.Rungs.InsertBefore($presetRung, $templateRung)

# Use the reset-before-count layout in Schneider EIO0000001474, page 169.
# Preserve rung indices and every other instruction; presets alone do not
# repair the invalid counter input ordering in the source program.
for ($counterIndex = 0; $counterIndex -lt 3; $counterIndex++) {
    $rung = @($pou.Rungs.RungEntity)[16 + $counterIndex]
    $items = @($rung.InstructionLines.InstructionLineEntity)
    if ($items.Count -ne 7 -or $items[0].InstructionLine.Trim() -ne ('BLK  %C' + $counterIndex)) {
        throw "Unexpected source counter rung $counterIndex"
    }
    $corrected = @(
        ('BLK  %C' + $counterIndex),
        'LD  %M40', 'R', 'LD  %TM1.Q',
        ('AND  %M' + (20 + $counterIndex)), 'CU', 'END_BLK'
    )
    for ($lineIndex = 0; $lineIndex -lt 7; $lineIndex++) {
        $items[$lineIndex].InstructionLine = $corrected[$lineIndex]
    }
}

$inputLabels = @(
    @('START_PB','Local plant start pushbutton'),
    @('STOP_OK','Normal stop loop; 1 healthy'),
    @('ESTOP_OK','Safety relay feedback; 1 healthy'),
    @('OL_CONVEYOR_OK','Ore conveyor overload; 1 healthy'),
    @('XRF_TRIGGER','Ore parcel at XRF analyser'),
    @('GRADE_HIGH','High-grade classification input'),
    @('GRADE_MEDIUM','Medium-grade classification input'),
    @('DIVERTER_HOME','All diverters home and safe'),
    @('SPARE_I08','Reserved field input'),
    @('SPARE_I09','Reserved field input'),
    @('SPARE_I10','Reserved field input'),
    @('SPARE_I11','Reserved field input'),
    @('SPARE_I12','Reserved field input'),
    @('SPARE_I13','Reserved field input')
)
$outputLabels = @(
    @('MOTOR_ORE_CONVEYOR','Ore analyser conveyor contactor/VFD'),
    @('DIVERTER_HIGH_GRADE','High-grade chute solenoid'),
    @('DIVERTER_MEDIUM_GRADE','Medium-grade chute solenoid'),
    @('DIVERTER_REJECT','Reject chute solenoid'),
    @('LAMP_RUN','Plant running beacon'),
    @('LAMP_FAULT','Common fault beacon'),
    @('SPARE_Q06','Reserved output'),
    @('SPARE_Q07','Reserved output'),
    @('SPARE_Q08','Reserved output'),
    @('SPARE_Q09','Reserved output')
)

$cpuInputs = @($doc.ProjectDescriptor.HardwareConfiguration.Plc.Cpu.DigitalInputs.DiscretInput)
for ($i = 0; $i -lt $cpuInputs.Count; $i++) {
    $cpuInputs[$i].Symbol = $inputLabels[$i][0]
    $cpuInputs[$i].Comment = $inputLabels[$i][1]
}
$cpuOutputs = @($doc.ProjectDescriptor.HardwareConfiguration.Plc.Cpu.DigitalOutputs.DiscretOutput)
for ($i = 0; $i -lt $cpuOutputs.Count; $i++) {
    $cpuOutputs[$i].Symbol = $outputLabels[$i][0]
    $cpuOutputs[$i].Comment = $outputLabels[$i][1]
}

$bitLabels = @{
    0=@('AUTO_MODE','1 automatic; 0 manual'); 1=@('START_HMI','Remote start pulse');
    2=@('STOP_HMI','Remote normal-stop command'); 3=@('AUTO_ENABLE','Automatic sorting enable');
    10=@('SYSTEM_RUN','Ore sorting run memory'); 11=@('SAFETY_OK','Safety permissive summary');
    12=@('MANUAL_DEMAND','Manual run demand'); 13=@('AUTO_DEMAND','Automatic run demand');
    14=@('REJECT_BIN_FULL','Reject-bin full interlock'); 20=@('HIGH_GRADE_LATCH','Current parcel high grade');
    21=@('MEDIUM_GRADE_LATCH','Current parcel medium grade'); 22=@('REJECT_LATCH','Current parcel rejected');
    23=@('SORT_BUSY','Sorting sequence active'); 24=@('DIVERTER_ACTIVE','Diverter phase active');
    25=@('SEQUENCE_RESET','Sequence-complete reset pulse'); 30=@('ALARM_ACTIVE','Common alarm summary');
    40=@('RESET_COUNTERS','Reset production counters')
}
foreach ($node in @($doc.ProjectDescriptor.SoftwareConfiguration.MemoryBits.MemoryBit)) {
    $index = [int]$node.Index
    if ($bitLabels.ContainsKey($index)) {
        $node.Symbol = $bitLabels[$index][0]
        $node.Comment = $bitLabels[$index][1]
    }
}

$timers = @($doc.ProjectDescriptor.SoftwareConfiguration.Timers.TimerTM)
if ($timers.Count -ge 2) {
    $timers[0].Symbol = 'ORE_TRAVEL_TIMER'
    $timers[0].Comment = 'Travel time from XRF to diverter'
    $timers[1].Symbol = 'DIVERTER_DWELL_TIMER'
    $timers[1].Comment = 'Diverter actuation dwell time'
}
$counterNames = @(
    @('HIGH_GRADE_TOTAL','High-grade ore parcel total'),
    @('MEDIUM_GRADE_TOTAL','Medium-grade ore parcel total'),
    @('REJECT_TOTAL','Rejected ore parcel total')
)
$counters = @($doc.ProjectDescriptor.SoftwareConfiguration.Counters.Counter)
for ($i = 0; $i -lt $counters.Count; $i++) {
    $counters[$i].Symbol = $counterNames[$i][0]
    $counters[$i].Comment = $counterNames[$i][1]
}

$settings = [System.Xml.XmlWriterSettings]::new()
$settings.Encoding = [System.Text.UTF8Encoding]::new($true)
$settings.Indent = $true
$settings.NewLineChars = "`r`n"
$settings.NewLineHandling = [System.Xml.NewLineHandling]::Replace
$writer = [System.Xml.XmlWriter]::Create($fullOutputPath, $settings)
try { $doc.Save($writer) } finally { $writer.Dispose() }

Write-Output $fullOutputPath
