const BAT_VOLT_HIGH = 41.1;
const BAT_VOLT_LOW = 30.5;

export function transform(
  upsData: Map<string, number | string>,
): Map<string, number | string> {
  if (upsData.has('battery.voltage')) {
    const batVolt = upsData.get('battery.voltage') as number;
    let level =
      ((batVolt - BAT_VOLT_LOW) / (BAT_VOLT_HIGH - BAT_VOLT_LOW)) * 100;
    if (Math.round(level) >= 100) level = 100;
    upsData.set('battery.charge', Math.round(level));
  }
  return upsData;
}
