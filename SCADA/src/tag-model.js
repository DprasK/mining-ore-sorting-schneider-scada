export const MODBUS_READ_PLAN = Object.freeze({ coilStart: 0, coilQuantity: 41 });

export const CONTROLS = Object.freeze({
  autoMode: { address: 0, label: 'AUTO MODE', kind: 'toggle' },
  start: { address: 1, label: 'START PLANT', kind: 'pulse' },
  stop: { address: 2, label: 'NORMAL STOP', kind: 'hold' },
  autoEnable: { address: 3, label: 'AUTO ENABLE', kind: 'toggle' },
  resetCounters: { address: 40, label: 'RESET COUNTERS', kind: 'pulse' }
});

export function decodeSnapshot(coils) {
  const coil = address => Boolean(coils[address - MODBUS_READ_PLAN.coilStart]);
  const safetyOk = coil(11);
  const alarmActive = coil(30);
  const sorterBusy = coil(23);
  const diverterActive = coil(24);
  const highGrade = coil(20);
  const mediumGrade = coil(21);
  const rejected = coil(22);
  const route = highGrade ? 'HIGH GRADE' : mediumGrade ? 'MEDIUM GRADE' : rejected ? 'REJECT' : 'UNCLASSIFIED';
  const alarms = alarmActive ? [{
    address: '%M30', code: 'ALARM_ACTIVE', severity: 'trip',
    message: 'Safety chain open or reject-bin-full interlock active'
  }] : [];

  return {
    system: {
      autoMode: coil(0), autoEnable: coil(3), systemRun: coil(10),
      safetyOk, alarmActive, rejectBinFull: coil(14)
    },
    equipment: [
      { id: 'conveyor', tag: 'CV-101', name: 'Ore Analyser Conveyor', command: coil(10), output: coil(10) && safetyOk && !diverterActive && !coil(14), feedback: coil(10), ready: safetyOk && !alarmActive, stageReady: !sorterBusy },
      { id: 'xrf101', tag: 'XRF-101', name: 'Grade Analyser', command: sorterBusy, output: sorterBusy, feedback: sorterBusy, ready: safetyOk, stageReady: sorterBusy },
      { id: 'gradeRoute', tag: 'DV-101A/B', name: 'Product Diverters', command: highGrade || mediumGrade, output: diverterActive && (highGrade || mediumGrade), feedback: diverterActive, ready: safetyOk, stageReady: highGrade || mediumGrade },
      { id: 'rejectRoute', tag: 'DV-101R', name: 'Reject Diverter', command: rejected, output: diverterActive && rejected, feedback: diverterActive, ready: safetyOk && !coil(14), stageReady: rejected }
    ],
    sorting: {
      busy: sorterBusy, diverterActive, highGrade, mediumGrade, rejected,
      sequenceReset: coil(25), route
    },
    diagnostics: {
      stopRequest: coil(2), rejectBinFull: coil(14), sorterBusy, diverterActive
    },
    controls: Object.fromEntries(Object.entries(CONTROLS).map(([name, meta]) => [name, { ...meta, value: coil(meta.address) }])),
    alarms
  };
}

export const TAGS = Object.freeze([
  ...Object.entries(CONTROLS).map(([name, item]) => ({ name, plc: `%M${item.address}`, modbus: item.address, type: 'BOOL', access: 'R/W whitelist' })),
  { name: 'SYSTEM_RUN', plc: '%M10', modbus: 10, type: 'BOOL', access: 'Read only' },
  { name: 'SAFETY_OK', plc: '%M11', modbus: 11, type: 'BOOL', access: 'Read only' },
  { name: 'REJECT_BIN_FULL', plc: '%M14', modbus: 14, type: 'BOOL', access: 'Read only' },
  { name: 'GRADE_LATCHES', plc: '%M20…%M22', modbus: '20…22', type: 'BOOL', access: 'Read only' },
  { name: 'SORT_BUSY', plc: '%M23', modbus: 23, type: 'BOOL', access: 'Read only' },
  { name: 'DIVERTER_ACTIVE', plc: '%M24', modbus: 24, type: 'BOOL', access: 'Read only' },
  { name: 'SEQUENCE_RESET', plc: '%M25', modbus: 25, type: 'BOOL', access: 'Read only' },
  { name: 'ALARM_ACTIVE', plc: '%M30', modbus: 30, type: 'BOOL', access: 'Read only' }
]);

