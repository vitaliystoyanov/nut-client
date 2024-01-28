import { join } from 'path';

export interface IconTheme {
  flash: string;

  batteryFull: string;
  battery80: string;
  batteryHalf: string;
  batteryLow: string;
  batteryEmpty: string;
  batteryCharging: string;
}

export interface IconThemes {
  [iconTheme: string]: IconTheme;
}

let iconThemes: IconThemes;

// https://www.flaticon.com/free-icon/half-battery_664882?term=battery&page=1&position=3&origin=style&related_id=664882
switch (process.platform) {
  case 'darwin':
    iconThemes = {
      black: {
        // TODO
        flash: join(__dirname, 'icons/darwin/white/flash_white_tray.png'),
        batteryFull: join(__dirname, 'icons/darwin/white/battery_full.png'),
        battery80: join(__dirname, 'icons/darwin/white/battery_80.png'),
        batteryHalf: join(__dirname, 'icons/darwin/white/battery_half.png'),
        batteryLow: join(__dirname, 'icons/darwin/white/battery_low.png'),
        batteryEmpty: join(__dirname, 'icons/darwin/white/battery_empty.png'),
        batteryCharging: join(
          __dirname,
          'icons/darwin/white/battery_charging.png',
        ),
      },
      white: {
        flash: join(__dirname, 'icons/darwin/white/flash_white_tray.png'),
        batteryFull: join(__dirname, 'icons/darwin/white/battery_full.png'),
        battery80: join(__dirname, 'icons/darwin/white/battery_80.png'),
        batteryHalf: join(__dirname, 'icons/darwin/white/battery_half.png'),
        batteryLow: join(__dirname, 'icons/darwin/white/battery_low.png'),
        batteryEmpty: join(__dirname, 'icons/darwin/white/battery_empty.png'),
        batteryCharging: join(
          __dirname,
          'icons/darwin/white/battery_charging.png',
        ),
      },
    };
    break;
  default: {
    throw new Error(
      `Platform "${process.platform}" is not currently supported!`,
    );
  }
}

export function batteryIconPicker(
  isCharging: boolean,
  level: number,
  theme: string,
) {
  if (isCharging) return iconThemes[theme].batteryCharging;
  if (level < 0) level = 1;
  if (level >= 95 && level <= 100) {
    return iconThemes[theme].batteryFull;
  } else if (level >= 65 && level <= 94) {
    return iconThemes[theme].battery80;
  } else if (level >= 35 && level <= 64) {
    return iconThemes[theme].batteryHalf;
  } else if (level >= 10 && level <= 34) {
    return iconThemes[theme].batteryLow;
  } else if (level >= 1 && level <= 9) {
    return iconThemes[theme].batteryEmpty;
  }
}

export default iconThemes;
