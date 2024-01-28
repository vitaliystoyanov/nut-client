// OL      -- On line (mains is present)
// OB      -- On battery (mains is not present)
// LB      -- Low battery
// HB      -- High battery
// RB      -- The battery needs to be replaced
// CHRG    -- The battery is charging
// DISCHRG -- The battery is discharging (inverter is providing load power)
// BYPASS  -- UPS bypass circuit is active -- no battery protection is available
// CAL     -- UPS is currently performing runtime calibration (on battery)
// OFF     -- UPS is offline and is not supplying power to the load
// OVER    -- UPS is overloaded
// TRIM    -- UPS is trimming incoming voltage (called "buck" in some hardware)
// BOOST   -- UPS is boosting incoming voltage
// FSD     -- Forced Shutdown (restricted use, see the note below)

// { OFF,	    OFF
// { OL,		  ONLINE
// { OB,		  ON BATTERY
// { LB,		  LOW BATTERY
// { RB,		  REPLACE BATTERY
// { OVER,	  OVERLOAD"
// { TRIM,	  VOLTAGE TRIM"
// { BOOST,	  VOLTAGE BOOST"
// { CAL,	    CALIBRATION"
// { BYPASS,	BYPASS"

export enum UPS_STATUS {
  OL = 'ONLINE',
  OB = 'ON BATTERY',
  LB = 'LOW BATTERY',
  HB = 'HIGH BATTERY',
  RB = 'REPLACE BATTERY',
  CHRG = 'CHARGING',
  DISCHRG = 'DISCHARGING',
  BYPASS = 'BYPASS',
  CAL = 'CALIBRATION',
  OFF = 'OFF',
  OVER = 'OVERLOAD',
  TRIM = 'VOLTAGE TRIM',
  BOOST = 'VOLTAGE BOOST',
  FSD = 'FORCED SHUTDOWN',

  UNKNOWN = 'UNKNOWN',
  ALARM = 'ALARM',
  WAIT = 'WAIT',
}

export function convertStatus(statusCombined: string): string {
  if (!statusCombined) return UPS_STATUS.UNKNOWN;
  if (statusCombined.includes('ALARM'))
    statusCombined = statusCombined.replace('ALARM ', '');
  if (statusCombined.includes(' ')) {
    const statuses = statusCombined.split(' ');
    let multipleStatuses = '';
    statuses.forEach((value) => {
      // TODO
      if (!value.includes(UPS_STATUS.ALARM)) {
        multipleStatuses = multipleStatuses.concat(UPS_STATUS[value]);
        multipleStatuses = multipleStatuses.concat(', ');
      }
    });
    // remove last space and return
    return multipleStatuses.substring(0, multipleStatuses.length - 2);
  }
  return UPS_STATUS[statusCombined];
}
