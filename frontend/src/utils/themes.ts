export interface Theme {
  primary: string[];
  secondary: string[];
  textColor: string;
  accentColor: string;
  bannerText: string;
  saleText: string;
  headerTextColor: string;
}

export const themes: Record<string, Theme> = {
  all: {
    primary: ['rgb(255, 193, 7)', 'rgb(255, 213, 79)', 'rgb(255, 236, 179)', 'rgb(255, 249, 196)'],
    secondary: ['rgb(255, 249, 196)', 'rgb(255, 236, 179)', 'rgb(255, 213, 79)'],
    textColor: '#452c00',
    accentColor: '#FF8F00',
    bannerText: 'HOUSEFULL',
    saleText: 'SALE',
    headerTextColor: '#452c00',
  },
  wedding: {
    primary: ['rgb(255, 236, 179)', 'rgb(255, 224, 130)', 'rgb(255, 213, 79)', 'rgb(255, 202, 40)'],
    secondary: ['rgb(255, 248, 225)', 'rgb(255, 236, 179)', 'rgb(255, 224, 130)'],
    textColor: '#452c00',
    accentColor: '#FF6F00',
    bannerText: 'WEDDING',
    saleText: 'SALE',
    headerTextColor: '#452c00',
  },
  winter: {
    primary: ['rgb(255, 249, 196)', 'rgb(255, 245, 157)', 'rgb(255, 241, 118)', 'rgb(255, 238, 88)'],
    secondary: ['rgb(255, 253, 231)', 'rgb(255, 249, 196)', 'rgb(255, 245, 157)'],
    textColor: '#3e2723',
    accentColor: '#fbc02d',
    bannerText: 'WINTER',
    saleText: 'SALE',
    headerTextColor: '#3e2723',
  },
  electronics: {
    primary: ['rgb(255, 213, 79)', 'rgb(255, 202, 40)', 'rgb(255, 179, 0)', 'rgb(255, 160, 0)'],
    secondary: ['rgb(255, 236, 179)', 'rgb(255, 213, 79)', 'rgb(255, 202, 40)'],
    textColor: '#212121',
    accentColor: '#ff8f00',
    bannerText: 'ELECTRONICS',
    saleText: 'SALE',
    headerTextColor: '#212121',
  },
  beauty: {
    primary: ['rgb(255, 245, 157)', 'rgb(255, 241, 118)', 'rgb(255, 238, 88)', 'rgb(255, 235, 59)'],
    secondary: ['rgb(255, 253, 231)', 'rgb(255, 249, 196)', 'rgb(255, 245, 157)'],
    textColor: '#1a1a1a',
    accentColor: '#fdd835',
    bannerText: 'BEAUTY',
    saleText: 'SALE',
    headerTextColor: '#1a1a1a',
  },
  grocery: {
    primary: ['rgb(255, 224, 130)', 'rgb(255, 213, 79)', 'rgb(255, 202, 40)', 'rgb(255, 193, 7)'],
    secondary: ['rgb(255, 248, 225)', 'rgb(255, 236, 179)', 'rgb(255, 224, 130)'],
    textColor: '#3e2723',
    accentColor: '#ffa000',
    bannerText: 'GROCERY',
    saleText: 'SALE',
    headerTextColor: '#3e2723',
  },
  fashion: {
    primary: ['rgb(255, 236, 179)', 'rgb(255, 224, 130)', 'rgb(255, 213, 79)', 'rgb(255, 202, 40)'],
    secondary: ['rgb(255, 248, 225)', 'rgb(255, 236, 179)', 'rgb(255, 224, 130)'],
    textColor: '#1a1a1a',
    accentColor: '#ffb300',
    bannerText: 'FASHION',
    saleText: 'SALE',
    headerTextColor: '#1a1a1a',
  },
  sports: {
    primary: ['rgb(255, 235, 59)', 'rgb(253, 216, 53)', 'rgb(251, 192, 45)', 'rgb(249, 168, 37)'],
    secondary: ['rgb(255, 249, 196)', 'rgb(255, 245, 157)', 'rgb(255, 241, 118)'],
    textColor: '#000000',
    accentColor: '#f9a825',
    bannerText: 'SPORTS',
    saleText: 'SALE',
    headerTextColor: '#000000',
  },
  orange: {
    primary: ['rgb(255, 183, 77)', 'rgb(255, 167, 38)', 'rgb(255, 152, 0)', 'rgb(245, 124, 0)'],
    secondary: ['rgb(255, 224, 178)', 'rgb(255, 204, 128)', 'rgb(255, 183, 77)'],
    textColor: '#3e2723',
    accentColor: '#ef6c00',
    bannerText: 'AUTUMN',
    saleText: 'SALE',
    headerTextColor: '#3e2723',
  },
  violet: {
    primary: ['rgb(167, 139, 250)', 'rgb(196, 181, 253)', 'rgb(221, 214, 254)', 'rgb(237, 233, 254)'],
    secondary: ['rgb(237, 233, 254)', 'rgb(221, 214, 254)', 'rgb(196, 181, 253)'],
    textColor: '#4c1d95',
    accentColor: '#5b21b6',
    bannerText: 'VIOLET',
    saleText: 'SALE',
    headerTextColor: '#2e1065',
  },
  teal: {
    primary: ['rgb(45, 212, 191)', 'rgb(94, 234, 212)', 'rgb(153, 246, 228)', 'rgb(204, 251, 241)'],
    secondary: ['rgb(204, 251, 241)', 'rgb(153, 246, 228)', 'rgb(94, 234, 212)'],
    textColor: '#115e59',
    accentColor: '#0f766e',
    bannerText: 'TEAL',
    saleText: 'SALE',
    headerTextColor: '#134e4a',
  },
  dark: {
    primary: ['rgb(75, 85, 99)', 'rgb(107, 114, 128)', 'rgb(156, 163, 175)', 'rgb(209, 213, 219)'],
    secondary: ['rgb(209, 213, 219)', 'rgb(156, 163, 175)', 'rgb(107, 114, 128)'],
    textColor: '#ffffff',
    accentColor: '#1f2937',
    bannerText: 'DARK',
    saleText: 'SALE',
    headerTextColor: '#000000',
  },
  hotpink: {
    primary: ['rgb(244, 114, 182)', 'rgb(249, 168, 212)', 'rgb(251, 207, 232)', 'rgb(253, 224, 239)'],
    secondary: ['rgb(253, 224, 239)', 'rgb(251, 207, 232)', 'rgb(249, 168, 212)'],
    textColor: '#831843',
    accentColor: '#9d174d',
    bannerText: 'PINK',
    saleText: 'SALE',
    headerTextColor: '#831843',
  },
  gold: {
    primary: ['rgb(250, 204, 21)', 'rgb(253, 224, 71)', 'rgb(254, 240, 138)', 'rgb(254, 249, 195)'],
    secondary: ['rgb(254, 249, 195)', 'rgb(254, 240, 138)', 'rgb(253, 224, 71)'],
    textColor: '#854d0e',
    accentColor: '#a16207',
    bannerText: 'GOLD',
    saleText: 'SALE',
    headerTextColor: '#713f12',
  },
};

export const getTheme = (tabId: string): Theme => {
  return themes[tabId] || themes.all;
};
