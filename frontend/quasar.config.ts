import { configure } from 'quasar/wrappers';

export default configure(() => {
  return {
    boot: ['i18n', 'axios'],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'] },
      typescript: { strict: true, vueShim: true },
      vueRouterMode: 'history',
      env: {
        API_URL: process.env.API_URL || 'http://localhost:3000',
      },
    },

    devServer: {
      open: false,
      port: 9002,
    },

    framework: {
      config: {
        dark: 'auto',
        brand: {
          primary: '#A67C52',
          secondary: '#8A7E72',
          accent: '#C6A882',
          positive: '#6B8A5E',
          negative: '#A65050',
          info: '#6E8898',
          warning: '#C6A882',
        },
      },
      plugins: ['Notify', 'Dialog', 'Loading'],
    },
  };
});
