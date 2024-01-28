import url from 'url';
import path from 'path';
import AutoLaunch from 'auto-launch';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Tray,
  powerMonitor,
  Notification
} from 'electron';
import store from '@common/store';
import iconThemes, { batteryIconPicker } from '@main/icons';
import { createMenuFull, createMenuNotAvaliable } from '@main/menu';
import { PreferencesSavedValues } from '@common/prefSavedValues';
import { isDifferent } from 'parser/upsData';
import {
  BCMXCP_PROCESS_NAME,
  instantUpsCmd,
  isPowerwareUSBDeviceConnected,
  isProcessRunning,
  requestUpsData,
  startBcmxcpDriverIfNotStarted,
  startUpsdIfNotStarted,
  restartUpsdProcess,
  UPS_NAME,
} from './cmder';
import { getTitleOnStatus } from './tray';
import moment from 'moment';
import { UPS_CMD } from '@common/upsCmd';
import { convertStatus, UPS_STATUS } from '@common/upsStatus';

moment.relativeTimeRounding((t) => {
  const DIGITS = 2; // like: 2.56 minutes
  return Math.round(t * Math.pow(10, DIGITS)) / Math.pow(10, DIGITS);
});
moment.relativeTimeThreshold('y', 365);
moment.relativeTimeThreshold('M', 12);
moment.relativeTimeThreshold('w', 4);
moment.relativeTimeThreshold('d', 31);
moment.relativeTimeThreshold('h', 24);
moment.relativeTimeThreshold('m', 60);
moment.relativeTimeThreshold('s', 60);
moment.relativeTimeThreshold('ss', 0);

let upsData: Map<string, number | string>;

const bootstrap = (): void => {
  let preferencesWindow: Electron.BrowserWindow;

  const createPreferencesWindow = (): void => {
    preferencesWindow = new BrowserWindow({
      width: 440,
      height: 600,
      show: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      webPreferences: { nodeIntegration: true },
    });

    if (process.env.NODE_ENV !== 'production') {
      preferencesWindow.loadURL(`http://localhost:3000`);
    } else {
      const pathname = path.join(__dirname, 'index.html');
      preferencesWindow.loadURL(
        url.format({ pathname, protocol: 'file:', slashes: true }),
      );
    }

    preferencesWindow.on('ready-to-show', () => {
      if (preferencesWindow) preferencesWindow.show();
      if (process.platform === 'darwin') app.dock.show();
    });

    preferencesWindow.on('closed', () => {
      preferencesWindow = null;
      if (process.platform === 'darwin') app.dock.hide();
    });
  };

  const setTrayMenu = ({
    upsData,
    icon,
  }: {
    upsData: Map<string, number | string>;
    icon?: string;
  }): void => {
    const menu = createMenuFull({
      upsData,
      createPreferencesWindow,
      isPreferencesWindowOpen: () => !!preferencesWindow,
      focusPreferencesWindow: () => preferencesWindow.focus(),
    });
    tray.setContextMenu(menu);
    if (icon) tray.setImage(icon);
  };

  async function requestUpsDriverData(): Promise<void>  {
    const data = await requestUpsData();
    //refrashContextMenu(data, upsData)
    upsData = data;

    const iconFlash = iconThemes['white'].flash;
    if (!data) {
      tray.setTitle('UPS: No data');
      tray.setImage(iconFlash);
      tray.setContextMenu(createMenuNotAvaliable({
        createPreferencesWindow,
        isPreferencesWindowOpen: () => !!preferencesWindow,
        focusPreferencesWindow: () => preferencesWindow.focus(),
      }));
    } else if (
      data.size < 10 &&
      data.has('ups.status') &&
      convertStatus(data.get('ups.status') as string).includes(UPS_STATUS.WAIT)
    ) {
      tray.setTitle('UPS: Initializing...');
      tray.setImage(iconFlash);
      tray.setContextMenu(createMenuNotAvaliable({
        createPreferencesWindow,
        isPreferencesWindowOpen: () => !!preferencesWindow,
        focusPreferencesWindow: () => preferencesWindow.focus(),
      }));
    } else {
      // upsData.set('battery.charger.status', 'floating');
      // upsData.set('battery.charge', 5)
      const icon = batteryIconPicker(
        (upsData.get('battery.charger.status') as string) == 'charging',
        upsData.get('battery.charge') as number,
        'white',
      );
      tray.setTitle(getTitleOnStatus(data));
      setTrayMenu({ upsData, icon });
    }
  };

  function refrashContextMenu(
    newData: Map<string, number | string>,
    oldData: Map<string, number | string>,
  ) {
    if (isDifferent(newData, oldData)) {
      console.log('UPS data is different...');
      tray.closeContextMenu();
      tray.popUpContextMenu();
    }
  }

  setInterval(requestUpsDriverData, 1700);

  const onPreferencesSaved = async (
    _event,
    values: PreferencesSavedValues,
  ): Promise<void> => {
    if (values.launchAtLogin !== store.get('launchAtLogin')) {
      values.launchAtLogin ? autoLaunch.enable() : autoLaunch.disable();
    }
    store.set(values);
    relaunchApp();
  };

  // Setup tray
  const tray = new Tray(iconThemes['white'].flash);

  // Auto launch
  const autoLaunch = new AutoLaunch({ name: 'NUT', isHidden: true });


  // Handle uncaught errors gracefully
  process.on('uncaughtException', (err) => {
    const window = BrowserWindow.getFocusedWindow();
    dialog.showMessageBox(window, {
      title: 'Application is not responding',
      buttons: ['Dismiss'],
      type: 'warning',
      message: `${err}`,
    });
  });

  // Platform specific app handling
  app.on('window-all-closed', () => {}); // eslint-disable-line
  if (process.platform === 'darwin') app.dock.hide();

  // Save preferences to store on renderer preferences save
  ipcMain.on('preferences-saved', onPreferencesSaved);

  powerMonitor.on('lock-screen', async () => {
    const isAutoShutdownEnabled = store.get('autoShutdown');
    if (!isAutoShutdownEnabled) return;
    console.log(
      'Power monitor: lock-screen event. Sending instant command to shutdown(stayoff)',
    );
    await instantUpsCmd(UPS_CMD.SHUTDOWN_STAYOFF);
  });

  powerMonitor.on('unlock-screen', async () => {
    const isAutoShutdownEnabled = store.get('autoShutdown');
    if (!isAutoShutdownEnabled) return;
    console.log(
      'Power monitor: unlock-screen event. Sending instant command to turn on load...',
    );
    await instantUpsCmd(UPS_CMD.LOAD_ON);
  });

  //createPreferencesWindow()
  // preferencesWindow.webContents.openDevTools()
};

app.on('ready', () => {
  //startUpsdIfNotStarted().then();
});

export async function relaunchApp() {
  app.relaunch();
  app.exit();
}

export async function quitApp() {
  app.quit();
}

app.whenReady().then(bootstrap);
