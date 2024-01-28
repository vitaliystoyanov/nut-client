import { Menu } from 'electron';

import moment from 'moment';
import { convertStatus, UPS_STATUS } from '@common/upsStatus';
import { UPS_CMD } from '@common/upsCmd';
import {
  instantUpsCmd,
  reloadUpsdConf as reloadUpsdConf,
  restartProcesses,
} from './cmder';
import { quitApp, relaunchApp } from './main';

export interface CreateMenuOptions {
  username?: string;
  upsData?: Map<string, number | string>;
  createPreferencesWindow: () => void;
  isPreferencesWindowOpen: () => boolean;
  focusPreferencesWindow: () => void;
}


export const createMenuFull = ({
  upsData,
  createPreferencesWindow,
  isPreferencesWindowOpen,
  focusPreferencesWindow,
}: CreateMenuOptions): Menu => {
  const onPreferencesClick = (): void => {
    if (!isPreferencesWindowOpen()) return createPreferencesWindow();
    focusPreferencesWindow();
  };

  return Menu.buildFromTemplate([
    {
      label: `Status: ${convertStatus(
        (upsData.get('ups.status') as string) || null,
      )}`,
      enabled: true,
    },
    // {
    //   label: `    Last update: ${moment
    //     .duration(
    //       moment.now() - (upsData.get('last.update') as number),
    //       'milliseconds',
    //     )
    //     .humanize()} ago`,
    //   enabled: false,
    // },
    { label: `Load: ${upsData.get('ups.load')}%`, enabled: true },
    {
      label: `Power: ${upsData.get('ups.power')}W / Real power: ${upsData.get(
        'ups.realpower',
      )}W [max: ${upsData.get('ups.power.nominal')}W]`,
      enabled: true,
    },
    {
      label:
        'Ambient temperature: ' +
        upsData.get('ambient.temperature') +
        '° [high: ' +
        upsData.get('ambient.temperature.high') +
        '°]',
      enabled: true,
    },
    {
      label: `Beeper status: ${upsData.get('ups.beeper.status')}`,
      enabled: true,
      submenu: [
        {
          label: `Enable the UPS beeper`,
          enabled: upsData.get('ups.beeper.status') != 'enabled',
          click: async () => await instantUpsCmd(UPS_CMD.BEEPER_ENABLE),
        },
        {
          label: `Disable the UPS beeper`,
          enabled: upsData.get('ups.beeper.status') == 'enabled',
          click: async () => await instantUpsCmd(UPS_CMD.BEEPER_DISABLE),
        },
        {
          label: `Temporarily mute the UPS beeper`,
          enabled: upsData.get('ups.beeper.status') == 'enabled',
          click: async () => await instantUpsCmd(UPS_CMD.BEEPER_MUTE),
        },
      ],
    },
    { type: 'separator' },
    {
      label: `Battery: ${upsData.get('battery.voltage') + 'V' || '--.--v'} / ${
        upsData.get('battery.charger.status') || '--'
      }: ${upsData.get('battery.charge') + '%' || '--%'}`,
      enabled: true,
    },
    {
      label: `    Runtime: ${moment
        .duration(upsData.get('battery.runtime') as number, 'seconds')
        .humanize(true)}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Input: ${
        upsData.get('input.voltage') + 'V' || '---V'
      } / Frequency: ${upsData.get('input.frequency') + 'Hz' || '--'} [high: ${
        upsData.get('input.frequency.high') + 'Hz' || '--Hz'
      }, low: ${upsData.get('input.frequency.low') + 'Hz' || '--Hz'}]`,
      enabled: true,
    },
    {
      label: `    Transfer boost high: ${
        upsData.get('input.transfer.boost.high') + 'V' || '---V'
      },  trim low: ${upsData.get('input.transfer.trim.low') + 'V' || '---V'}`,
      enabled: false,
    },
    {
      label: `    Transfer [high: ${
        upsData.get('input.transfer.high') + 'V' || '---V'
      }, low: ${upsData.get('input.transfer.low') + 'V' || '---V'}]`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Output: ${
        upsData.get('output.voltage') + 'V' || '---v'
      } / Frequency: ${upsData.get('output.frequency') + 'Hz' || '--Hz'}`,
      enabled: true,
    },
    {
      label: `    Current: ${upsData.get('output.current') + 'A' || '-.-A'}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Outlet #${upsData.get('outlet.1.id') || '-'} / Status: ${
        upsData.get('outlet.1.status') || '--/--'
      }`,
      enabled: true,
      submenu: [
        {
          label: `Turn on the load on outlet 1 immediately`,
          enabled: upsData.get('outlet.1.status')
            ? upsData.get('outlet.1.status').toString().includes('off')
            : false,
          click: async () => await instantUpsCmd(UPS_CMD.OUTLET_1_LOAD_ON),
        },
        {
          label: `Turn off the load on outlet 1 immediately`,
          enabled: upsData.get('outlet.1.status')
            ? upsData.get('outlet.1.status').toString().includes('on')
            : false,
          click: async () => await instantUpsCmd(UPS_CMD.OUTLET_1_LOAD_OFF),
        },
        {
          label: `Turn off the outlet 1 and return when power is back`,
          enabled: upsData.get('outlet.1.status')
            ? upsData.get('outlet.1.status').toString().includes('on')
            : false,
          click: async () =>
            await instantUpsCmd(UPS_CMD.OUTLET_1_SHUTDOWN_RETURN),
        },
      ],
    },
    {
      label: `    Delay:  shutdown ${
        upsData.get('outlet.1.delay.shutdown') + ' sec' || '--sec'
      } / start ${upsData.get('outlet.1.delay.start') + ' sec' || '-- sec'}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Outlet #${upsData.get('outlet.2.id') || '-'} / Status: ${
        upsData.get('outlet.2.status') || '--/--'
      }`,
      enabled: true,
      submenu: [
        {
          label: `Turn on the load on outlet 2 immediately`,
          enabled: upsData.get('outlet.2.status')
            ? upsData.get('outlet.2.status').toString().includes('off')
            : false,
          click: async () => await instantUpsCmd(UPS_CMD.OUTLET_2_LOAD_ON),
        },
        {
          label: `Turn off the load on outlet 2 immediately`,
          enabled: upsData.get('outlet.2.status')
            ? upsData.get('outlet.2.status').toString().includes('on')
            : false,
          click: async () => await instantUpsCmd(UPS_CMD.OUTLET_2_LOAD_OFF),
        },
        {
          label: `Turn off the outlet 2 and return when power is back`,
          enabled: upsData.get('outlet.2.status')
            ? upsData.get('outlet.2.status').toString().includes('on')
            : false,
          click: async () =>
            await instantUpsCmd(UPS_CMD.OUTLET_2_SHUTDOWN_RETURN),
        },
      ],
    },
    {
      label: `    Delay:  shutdown ${
        upsData.get('outlet.2.delay.shutdown') + ' sec' || '--sec'
      } / start ${upsData.get('outlet.2.delay.start') + ' sec' || '-- ec'}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Power on / Turn on the load`,
      enabled: convertStatus(upsData.get('ups.status') as string).includes(
        UPS_STATUS.OFF,
      ),
      click: async () => await instantUpsCmd(UPS_CMD.LOAD_ON),
    },
    {
      label: 'Shutdown and return',
      enabled: convertStatus(upsData.get('ups.status') as string).includes(
        UPS_STATUS.OB,
      ),
      accelerator: 'CmdOrCtrl+R',
      click: async () => await instantUpsCmd(UPS_CMD.SHUTDOWN_RETURN),
    },
    {
      label: 'Shutdown and stayoff',
      enabled: !convertStatus(upsData.get('ups.status') as string).includes(
        UPS_STATUS.OFF,
      ),
      accelerator: 'CmdOrCtrl+O',
      click: async () => await instantUpsCmd(UPS_CMD.SHUTDOWN_STAYOFF),
    },
    {
      label: `UPS Test: ${upsData.get('ups.test.result')}`,
      enabled:
        !convertStatus(upsData.get('ups.status') as string).includes(
          UPS_STATUS.OFF,
        ) ||
        !convertStatus(upsData.get('ups.status') as string).includes(
          UPS_STATUS.OB,
        ),
      submenu: [
        {
          label: `Start a battery test`,
          enabled: true,
          click: async () => await instantUpsCmd(UPS_CMD.TEST_BATTERY_START),
        },
        {
          label: `Start a system test`,
          enabled: true,
          click: async () => await instantUpsCmd(UPS_CMD.TEST_SYSTEM_START),
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: onPreferencesClick,
    },
    {
      label: `About ${upsData.get('ups.model')}`,
      //click: (): Promise<void> => shell.openExternal(pjson.homepage),
      submenu: [
        { label: `Firmware: ${upsData.get('ups.firmware')}`, enabled: false },
        {
          label: `Description: ${upsData.get('ups.description')}`,
          enabled: false,
        },
        {
          label: `Manufacturer: ${upsData.get('device.mfr')}`,
          enabled: false,
        },
        { label: `Model: ${upsData.get('device.model')}`, enabled: false },
        { label: `Part: ${upsData.get('device.part')}`, enabled: false },
        { label: `Serial: ${upsData.get('device.serial')}`, enabled: false },
        {
          label: `Driver name: ${upsData.get('driver.name')}`,
          enabled: false,
        },
        {
          label: `Driver version: ${upsData.get('driver.version')}`,
          enabled: false,
        },
        {
          label: `Internal driver version: ${upsData.get(
            'driver.version.internal',
          )}`,
          enabled: false,
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Relaunch',
      accelerator: 'CmdOrCtrl+R',
      click: async (): Promise<void> => await relaunchApp(),
    },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: async (): Promise<void> => await quitApp(),
    },
  ]);
};

export function createMenuNotAvaliable({
  createPreferencesWindow,
  isPreferencesWindowOpen,
  focusPreferencesWindow,
}: CreateMenuOptions) : Menu {
  const onPreferencesClick = (): void => {
    if (!isPreferencesWindowOpen()) return createPreferencesWindow();
    focusPreferencesWindow();
  };
  return Menu.buildFromTemplate([
    {
      label: 'Reload service configuration',
      click: () => reloadUpsdConf(),
    },
    {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: onPreferencesClick,
    },
    { type: 'separator' },
    {
      label: 'Relaunch',
      accelerator: 'CmdOrCtrl+R',
      click: async (): Promise<void> => await relaunchApp(),
    },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: async (): Promise<void> => await quitApp(),
    },
  ]);
}
