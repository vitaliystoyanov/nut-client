import util from 'util';
import childProcess, { spawn } from 'child_process';
import { UPS_CMD } from '@common/upsCmd';
import { parseUpsData } from 'parser/upsData';
import store from '@common/store';

export const UPS_NAME = 'pw5115';
export const UPSD_PROCESS_NAME = 'upsd';
export const BCMXCP_PROCESS_NAME = 'bcmxcp_usb';
// NUT related installation path
const NUT_SBIN_PATH = '/opt/local/sbin';
const NUT_BIN_PATH = '/opt/local/bin';
// Commands
const NUT_START_UPSD_SERVICE = `${NUT_SBIN_PATH}/upsd`;
const NUT_UPSD_VERSION = `${NUT_SBIN_PATH}/upsd -V`;
const NUT_RELOAD_UPSD_SERVICE = `${NUT_SBIN_PATH}/upsd -c reload`;
//const NUT_UPS_INSTANT_CMD = `${NUT_BIN_PATH}/upscmd -u ${store.get('upsdUser')} -p ${store.get('upsdPassword')}`;
const NUT_UPS_INSTANT_CMD = `upscmd -u ${store.get('upsdUser')} -p ${store.get('upsdPassword')}`;
//const NUT_UPSC_CMD = `${NUT_BIN_PATH}/upsc ${store.get('upsdServer')}`;
const NUT_UPSC_CMD = `upsc ${store.get('upsdServer')}`;

// 115200 921600
const NUT_UPS_DRIVER_RUN = `${NUT_BIN_PATH}/bcmxcp_usb -a ${UPS_NAME} -DD -i 1 -x baud_rate=115200`;

const PKILL_AND_START_UPSD_CMD = `pkill -9 ${UPSD_PROCESS_NAME} && ${NUT_START_UPSD_SERVICE}`;
const PKILL_AND_START_DRIVER_CMD = `pkill -9 ${BCMXCP_PROCESS_NAME} && ${NUT_UPS_DRIVER_RUN}`;

const POWEWARE_UPS_PRODUCT_ID = '0x0002';
const POWERWARE_UPS_USB_NAME = 'Powerware UPS';

const exec = util.promisify(childProcess.exec);
import sudo from 'sudo-prompt';
import { dialog } from 'electron';
import { transform } from './dataTransform';

import axios from 'axios';

const instance = axios.create({
  baseURL: store.get('shell2httpServer'),
});

const upsName = store.get('upsName');
const upsUser = store.get('upsdUser');
const upsPassowrd = store.get('upsdPassword');

const promtUpsdOptions = {
  name: 'upsd',
};

export enum CMD_RUN_STATUS {
  OK,
  ERROR,
}

export async function isProcessRunning(processName: string) {
  const RUNNING = 'running';
  const STOPPED = 'stopped';
  const PGREP_CHECK = `if pgrep -x "${processName}" > /dev/null; then echo "${RUNNING}"; else echo "${STOPPED}"; fi`;
  let stdout = undefined;
  try {
    stdout = (await exec(PGREP_CHECK)).stdout;
    return stdout.includes(RUNNING);
  } catch (err) {
    return false;
  }
}

export async function startUpsdIfNotStarted() {
  isProcessRunning(UPSD_PROCESS_NAME).then((value) => {
    if (!value) {
      console.log(
        `${UPSD_PROCESS_NAME} is not running. Starting a new process...`,
      );
      startUpsd();
    }
  });
}

export async function startBcmxcpDriverIfNotStarted() {
  isProcessRunning(BCMXCP_PROCESS_NAME).then((value) => {
    if (!value) {
      console.log(
        `${BCMXCP_PROCESS_NAME} is not running. Starting a new process...`,
      );
      startPowerwareDriver();
    }
  });
}

export async function versionUpsd() {
  let return_;
  try {
    return_ = await exec(NUT_UPSD_VERSION);
    return { cmdResult: return_.stdout, status: CMD_RUN_STATUS.OK };
  } catch (err) {
    return { cmdResult: return_.stderr, status: CMD_RUN_STATUS.ERROR };
  }
}

export function startUpsd() {
  sudo.exec(
    NUT_START_UPSD_SERVICE,
    promtUpsdOptions,
    (_error, _stdout, _stderr) => console.log('upsd started'),
  );
}

export function restartUpsdProcess() {
  sudo.exec(
    PKILL_AND_START_UPSD_CMD,
    promtUpsdOptions,
    (_error, _stdout, _stderr) => {
      console.log("upsd stopped. It's going to start again...");
    },
  );
}

export function restartDriverProcess() {
  sudo.exec(
    PKILL_AND_START_DRIVER_CMD,
    promtUpsdOptions,
    (_error, _stdout, _stderr) => {
      console.log("bcmxcp stopped. It's going to start again...");
    },
  );
}

export function restartProcesses() {
  restartUpsdProcess();
  restartDriverProcess();
}

export function reloadUpsdConf() {
  sudo.exec(
    NUT_RELOAD_UPSD_SERVICE,
    promtUpsdOptions,
    (_error, stdout, _stderr) => {
      console.log('Reloading upsd service: ' + stdout);
      // todo move to UI
      versionUpsd().then((value) => {
        dialog.showMessageBox({
          title: `NUT`,
          message: `Services reloaded`,
          detail: `${value.cmdResult}`,
          buttons: [],
        });
      });
    },
  );
}

export function startPowerwareDriver() {
  const options = {
    name: 'bcmxcp driver',
  };
  sudo.exec(NUT_UPS_DRIVER_RUN, options, (error, stdout, _stderr) => {
    console.log('powerware driver: ' + stdout + ', ' + error);
  });
}

export async function instantUpsCmd(cmd: UPS_CMD) {
  try {
    const response = await instance.get(`/upscmd/exec?ups=${upsName}&ups_user=${upsUser}&ups_password=${upsPassowrd}&command=${cmd}&value=false`);
    return { status: CMD_RUN_STATUS.OK };
  } catch (err) {
    return { status: CMD_RUN_STATUS.ERROR };
  }
}

export async function isPowerwareUSBDeviceConnected(): Promise<
  | { value: boolean; status: CMD_RUN_STATUS }
  | { value: boolean; error: string; status: CMD_RUN_STATUS }
> {
  const process = childProcess.spawn('system_profiler', ['SPUSBDataType']);
  return new Promise(function (resolve, _reject) {
    let data_: string;
    process.stdout.on('data', (data) => {
      data_ += data;
    });

    process.on('close', (_code) => {
      resolve({
        value: parseSystemProfilerStdout(data_),
        status: CMD_RUN_STATUS.OK,
      });
    });
  });
}

export async function requestUpsData(): Promise<Map<
  string,
  number | string
> | null> {
  try {
    const response = await instance.get(`/upsc?ups=${upsName}`);
    return transform(parseUpsData(response.data));
  } catch (err) {
    return null;
  }
}

function parseSystemProfilerStdout(stdout: string): boolean {
  return (
    stdout.includes(POWEWARE_UPS_PRODUCT_ID) ||
    stdout.includes(POWERWARE_UPS_USB_NAME)
  );
}
