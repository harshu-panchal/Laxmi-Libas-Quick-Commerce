export interface Theme {
  primary: string[];
  secondary: string[];
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
  bannerText: string;
  saleText: string;
  headerTextColor: string;
}

export const themes: Record<string, Theme> = {
  all: {
    primary: ['#FCDC75', '#FCE291', '#FDE9AC', '#FEEFCA'],
    secondary: ['#FEEFCA', '#FDE9AC', '#FCE291'],
    backgroundColor: '#ffffff',
    surfaceColor: '#f8fafc',
    textColor: '#000000',
    accentColor: '#D4B84D',
    bannerText: 'HOUSEFULL',
    saleText: 'SALE',
    headerTextColor: '#000000',
  },
  clothing: {
    primary: ['rgb(254, 205, 211)', 'rgb(251, 164, 175)', 'rgb(244, 114, 182)', 'rgb(253, 242, 248)'], // Soft Pink
    secondary: ['rgb(253, 242, 248)', 'rgb(252, 231, 243)', 'rgb(251, 207, 232)'],
    backgroundColor: '#fff1f2',
    surfaceColor: '#fff8f9',
    textColor: '#831843',
    accentColor: '#be123c',
    bannerText: 'CLOTHING',
    saleText: 'FASHION SALE',
    headerTextColor: '#831843',
  },
  footwear: {
    primary: ['rgb(191, 219, 254)', 'rgb(147, 197, 253)', 'rgb(96, 165, 250)', 'rgb(239, 246, 255)'], // Soft Blue
    secondary: ['rgb(239, 246, 255)', 'rgb(219, 234, 254)', 'rgb(191, 219, 254)'],
    backgroundColor: '#eff6ff',
    surfaceColor: '#f8fafc',
    textColor: '#1e3a8a',
    accentColor: '#2563eb',
    bannerText: 'FOOTWEAR',
    saleText: 'SALE',
    headerTextColor: '#1e3a8a',
  },
  grocery: {
    primary: ['rgb(187, 247, 208)', 'rgb(134, 239, 172)', 'rgb(74, 222, 128)', 'rgb(240, 253, 244)'], // Soft Green
    secondary: ['rgb(240, 253, 244)', 'rgb(220, 252, 231)', 'rgb(187, 247, 208)'],
    backgroundColor: '#f0fdf4',
    surfaceColor: '#f7fee7',
    textColor: '#14532d',
    accentColor: '#16a34a',
    bannerText: 'GROCERY',
    saleText: 'FRESH SALE',
    headerTextColor: '#14532d',
  },
  food: {
    primary: ['rgb(255, 237, 213)', 'rgb(254, 215, 170)', 'rgb(253, 186, 116)', 'rgb(255, 247, 237)'], // Soft Orange
    secondary: ['rgb(255, 247, 237)', 'rgb(255, 237, 213)', 'rgb(254, 215, 170)'],
    backgroundColor: '#fff7ed',
    surfaceColor: '#fffaf5',
    textColor: '#7c2d12',
    accentColor: '#ea580c',
    bannerText: 'FOOD',
    saleText: 'DELICIOUS',
    headerTextColor: '#7c2d12',
  },
  'fruits-vegetables': {
    primary: ['#d9f99d', '#bef264', '#a3e635', '#f7fee7'], // Soft Lime
    secondary: ['#f7fee7', '#ecfccb', '#d9f99d'],
    backgroundColor: '#f7fee7',
    surfaceColor: '#fafff0',
    textColor: '#365314',
    accentColor: '#65a30d',
    bannerText: 'FRESH',
    saleText: 'ORGANIC',
    headerTextColor: '#365314',
  },
  beauty: {
    primary: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#f5f3ff'], // Soft Violet
    secondary: ['#f5f3ff', '#ede9fe', '#ddd6fe'],
    backgroundColor: '#f5f3ff',
    surfaceColor: '#fafaff',
    textColor: '#4c1d95',
    accentColor: '#7c3aed',
    bannerText: 'BEAUTY',
    saleText: 'GLOW UP',
    headerTextColor: '#2e1065',
  },
  electronics: {
    primary: ['#cffafe', '#a5f3fc', '#67e2f9', '#ecfeff'], // Soft Cyan
    secondary: ['#ecfeff', '#d1fae5', '#cffafe'],
    backgroundColor: '#ecfeff',
    surfaceColor: '#f5ffff',
    textColor: '#164e63',
    accentColor: '#0891b2',
    bannerText: 'TECH',
    saleText: 'SMART DEALS',
    headerTextColor: '#164e63',
  },
  toys: {
    primary: ['#fef08a', '#fde047', '#facc15', '#fefce8'], // Soft Yellow
    secondary: ['#fefce8', '#fef9c3', '#fef08a'],
    backgroundColor: '#fefce8',
    surfaceColor: '#fffdec',
    textColor: '#854d0e',
    accentColor: '#ca8a04',
    bannerText: 'TOYS',
    saleText: 'PLAY TIME',
    headerTextColor: '#713f12',
  },
  'home-furniture': {
    primary: ['#fde68a', '#fcd34d', '#fbbf24', '#fffbeb'], // Soft Amber
    secondary: ['#fffbeb', '#fef3c7', '#fde68a'],
    backgroundColor: '#fffbeb',
    surfaceColor: '#fffdf5',
    textColor: '#78350f',
    accentColor: '#d97706',
    bannerText: 'HOME',
    saleText: 'COMFORT',
    headerTextColor: '#78350f',
  },
  eyeglasses: {
    primary: ['#c7d2fe', '#a5b4fc', '#818cf8', '#eef2ff'], // Soft Indigo
    secondary: ['#eef2ff', '#e0e7ff', '#c7d2fe'],
    backgroundColor: '#eef2ff',
    surfaceColor: '#f5f7ff',
    textColor: '#312e81',
    accentColor: '#4f46e5',
    bannerText: 'EYEWEAR',
    saleText: 'VISION',
    headerTextColor: '#312e81',
  },
  rental: {
    primary: ['#99f6e4', '#5eead4', '#2dd4bf', '#f0fdfa'], // Soft Teal
    secondary: ['#f0fdfa', '#ccfbf1', '#99f6e4'],
    backgroundColor: '#f0fdfa',
    surfaceColor: '#fafffe',
    textColor: '#134e4a',
    accentColor: '#0d9488',
    bannerText: 'RENTAL',
    saleText: 'RENT NOW',
    headerTextColor: '#134e4a',
  },
  'automotive-parts': {
    primary: ['#38bdf8', '#0ea5e9', '#0284c7', '#e0f2fe'], // Vibrant Sky Blue to Ocean Blue
    secondary: ['#f0f9ff', '#e0f2fe', '#bae6fd'],
    backgroundColor: '#f0f9ff', // Very light Azure
    surfaceColor: '#e0f2fe', // Sky blue tint
    textColor: '#075985',
    accentColor: '#0ea5e9',
    bannerText: 'AUTO',
    saleText: 'PARTS',
    headerTextColor: '#075985',
  },
  services: {
    primary: ['#fecdd3', '#fda4af', '#fb7185', '#fff1f2'], // Soft Rose
    secondary: ['#fff1f2', '#ffe4e6', '#fecdd3'],
    backgroundColor: '#fff1f2',
    surfaceColor: '#fff5f7',
    textColor: '#881337',
    accentColor: '#e11d48',
    bannerText: 'SERVICES',
    saleText: 'EXPERT',
    headerTextColor: '#881337',
  },
};

export const getTheme = (tabId: string): Theme => {
  return themes[tabId] || themes.all;
};
