import { convertStatus, UPS_STATUS } from '@common/upsStatus';
import store from '@common/store';

const UPS_STATUS_TITLE = 'UPS Status';
const UPS_CMD_EXECUTION = 'UPS Exec';
const UPS_TEST_EXECUTION = 'UPS Test';

const getUpsTrayStatusTitle = (data: Map<string, number | string>) => {
  const upsTest = data.get('ups.test.result') as string;
  const upsStatus = convertStatus((data.get('ups.status') as string) || null);
  if (upsTest.toLocaleLowerCase().includes('in progress')) {
    return `${UPS_TEST_EXECUTION}: ${upsTest}`;
  } else {
    return `${UPS_STATUS_TITLE}: ${upsStatus}`;
  }
};

export function getTitleOnStatus(
  data: Map<string, number | string>,
  isCompactView = true,
): string {
  const upsStatusTray = getUpsTrayStatusTitle(data);
  const upsStatus = convertStatus((data.get('ups.status') as string) || null);

  const temp = isCompactView ? 'T:' : 'Temp:';
  const load = isCompactView ? 'L:' : 'Load:';
  const batLevel = store.get('batPercentageTray')
    ? `${data.get('battery.charge')}% | `
    : '';

  if (upsStatus.includes(UPS_STATUS.OB)) {
    return ` ${batLevel}${upsStatusTray} | ${temp} ${data.get(
      'ambient.temperature',
    )}° | ${load} ${data.get('ups.load')}%`;
  } else {
    return ` ${batLevel}${upsStatusTray}`;
  }
}
