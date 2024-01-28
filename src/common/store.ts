import Store from 'electron-store';

const store = new Store({
  defaults: {
    launchAtLogin: false,
    autoFan: true,
    autoShutdown: false,
    batPercentageTray: true,
    shell2httpServer: '',
    upsName: '',
    upsdUser: '',
    upsdPassword: ''
  },
});

export default store;
