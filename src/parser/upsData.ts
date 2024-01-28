export type UpsVars = {
  'ambient.temperature'?: number;
  'ambient.temperature.high'?: number;

  'battery.charge'?: number;
  'battery.charger.status'?: string;
  'battery.packs'?: number;
  'battery.runtime'?: number;
  'battery.runtime.low'?: number;
  'battery.voltage'?: number;

  'device.mfr'?: string;
  'device.model'?: string;
  'device.part'?: string;
  'device.serial'?: string;
  'device.type'?: string;

  'driver.name'?: string;
  'driver.parameter.pollinterval'?: number;
  'driver.parameter.port'?: string;
  'driver.parameter.synchronous'?: string;
  'driver.version'?: string;
  'driver.version.internal'?: string;

  'input.frequency'?: number;
  'input.frequency.high'?: number;
  'input.frequency.low'?: number;
  'input.frequency.nominal'?: number;
  'input.transfer.boost.high'?: number;
  'input.transfer.high'?: number;
  'input.transfer.low'?: number;
  'input.transfer.trim.low'?: number;
  'input.voltage'?: number;
  'input.voltage.nominal'?: number;

  'outlet.1.delay.shutdown'?: number;
  'outlet.1.delay.start'?: number;
  'outlet.1.id'?: number;
  'outlet.1.status'?: string;

  'outlet.2.delay.shutdown'?: number;
  'outlet.2.delay.start'?: number;
  'outlet.2.id'?: number;
  'outlet.2.status'?: string;

  'output.current'?: number;
  'output.current.nominal'?: number;
  'output.frequency'?: number;
  'output.frequency.nominal'?: number;
  'output.phases'?: number;
  'output.voltage'?: number;
  'output.voltage.nominal'?: number;

  'ups.beeper.status'?: string;
  'ups.description'?: string;
  'ups.firmware'?: string;
  'ups.load'?: number;
  'ups.mfr'?: string;
  'ups.model'?: string;
  'ups.power'?: number;
  'ups.power.nominal'?: number;
  'ups.realpower'?: number;
  'ups.serial'?: string;
  'ups.status'?: string;
  'ups.test.result'?: string;
};

export function parseUpsData(data: string): Map<string, number | string> {
  const map = new Map<string, number | string>();
  const arr = data.split('\n');

  arr.forEach(function (value) {
    if (value.includes(':')) {
      const par = value.split(':')[0];
      const parVal = value.split(':')[1].trim();
      let intPatval: number | string = parseFloat(parVal);
      if (Number.isNaN(intPatval)) {
        intPatval = parseFloat(parVal);
      }
      if (Number.isNaN(intPatval)) {
        intPatval = String(parVal);
      }
      map.set(par, intPatval);
    }
  });

  return map;
}

export function isDifferent(dataNew, dataOld): boolean {
  if (!dataNew) return true;
  if (!dataOld) return true;
  dataNew.forEach(function (value, key) {
    if (!dataOld.has(key) || dataNew.get(key) != dataOld.get(key)) {
      return true;
    }
  });
  return false;
}
