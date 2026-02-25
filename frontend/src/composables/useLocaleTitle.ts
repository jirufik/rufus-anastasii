import { useI18n } from 'vue-i18n';
import type { LocationDto } from 'src/services/api.service';

const LOCALE_MAP: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-GB',
  fi: 'fi-FI',
};

export function useLocaleTitle() {
  const { locale } = useI18n();

  function getTitle(location: LocationDto): string {
    const localeMap: Record<string, string | undefined> = {
      ru: location.titleRu,
      en: location.titleEn,
      fi: location.titleFi,
    };
    return localeMap[locale.value] || location.titleRu || location.titleEn || '';
  }

  function getDescription(location: LocationDto): string {
    const localeMap: Record<string, string | undefined> = {
      ru: location.descriptionRu,
      en: location.descriptionEn,
      fi: location.descriptionFi,
    };
    return localeMap[locale.value] || location.descriptionRu || location.descriptionEn || '';
  }

  function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const date: Date = new Date(dateStr);
      const intlLocale: string = LOCALE_MAP[locale.value] || 'en-GB';
      return date.toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return { getTitle, getDescription, formatDate };
}
