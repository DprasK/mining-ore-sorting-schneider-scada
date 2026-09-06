import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeSnapshot, MODBUS_READ_PLAN } from '../src/tag-model.js';

test('decodeSnapshot maps the compile-safe M221 ore-sorting memory image', () => {
  const coils = Array(MODBUS_READ_PLAN.coilQuantity).fill(false);
  coils[0] = true;
  coils[3] = true;
  coils[10] = true;
  coils[11] = true;
  coils[20] = true;
  coils[23] = true;
  coils[24] = true;
  const data = decodeSnapshot(coils);
  assert.equal(data.system.autoMode, true);
  assert.equal(data.system.autoEnable, true);
  assert.equal(data.system.systemRun, true);
  assert.equal(data.sorting.route, 'HIGH GRADE');
  assert.equal(data.equipment.find(item => item.id === 'gradeRoute').output, true);
});

test('decodeSnapshot exposes only the real PLC common alarm bit', () => {
  const coils = Array(MODBUS_READ_PLAN.coilQuantity).fill(false);
  coils[14] = true;
  coils[30] = true;
  const data = decodeSnapshot(coils);
  assert.equal(data.system.rejectBinFull, true);
  assert.deepEqual(data.alarms.map(item => item.code), ['ALARM_ACTIVE']);
});
