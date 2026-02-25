import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import ru from 'src/i18n/ru';
import en from 'src/i18n/en';
import fi from 'src/i18n/fi';

const i18n = createI18n({
  locale: 'ru',
  fallbackLocale: 'en',
  legacy: false,
  messages: { ru, en, fi },
});

export default boot(({ app }) => {
  app.use(i18n);
});

export { i18n };
