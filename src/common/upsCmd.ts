// Instant commands supported on UPS [pw5115]:

// beeper.disable               - Disable the UPS beeper
// beeper.enable                - Enable the UPS beeper
// beeper.mute                  - Temporarily mute the UPS beeper
// load.on                      - Turn on the load immediately
// outlet.1.load.off            - Turn off the load on outlet 1 immediately
// outlet.1.load.on             - Turn on the load on outlet 1 immediately
// outlet.1.shutdown.return     - Turn off the outlet 1 and return when power is back
// outlet.2.load.off            - Turn off the load on outlet 2 immediately
// outlet.2.load.on             - Turn on the load on outlet 2 immediately
// outlet.2.shutdown.return     - Turn off the outlet 2 and return when power is back
// shutdown.return              - Turn off the load and return when power is back
// shutdown.stayoff             - Turn off the load and remain off
// test.battery.start           - Start a battery test
// test.system.start            - Start a system test
export enum UPS_CMD {
  BEEPER_DISABLE = 'beeper.disable',
  BEEPER_ENABLE = 'beeper.enable',
  BEEPER_MUTE = 'beeper.mute',
  LOAD_ON = 'load.on ',
  OUTLET_1_LOAD_OFF = 'outlet.1.load.off',
  OUTLET_1_LOAD_ON = 'outlet.1.load.on ',
  OUTLET_1_SHUTDOWN_RETURN = 'outlet.1.shutdown.return',
  OUTLET_2_LOAD_OFF = 'outlet.2.load.off',
  OUTLET_2_LOAD_ON = 'outlet.2.load.on ',
  OUTLET_2_SHUTDOWN_RETURN = 'outlet.2.shutdown.return',
  SHUTDOWN_RETURN = 'shutdown.return ',
  SHUTDOWN_STAYOFF = 'shutdown.stayoff',
  TEST_BATTERY_START = 'test.battery.start',
  TEST_SYSTEM_START = 'test.system.start',
}
