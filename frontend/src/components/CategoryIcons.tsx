import React from 'react';

export const CategoryIcons = {
  ForYou: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 8V6a4 4 0 1 1 8 0v2 M6 8h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <path d="M8 8v3a4 4 0 0 0 8 0V8H8Z" fill="#ffec00" stroke="currentColor" />
    </svg>
  ),
  Fashion: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 4h6l3 3v2l-3-1v9H9v-9l-3 1V7l3-3Z" />
      <path d="M9 15h6v2H9v-2Z" fill="#ffec00" stroke="none" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  Mobiles: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M7 17h10v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2Z" fill="#ffec00" stroke="none" />
      <line x1="10" y1="18" x2="14" y2="18" />
      <line x1="7" y1="17" x2="17" y2="17" />
    </svg>
  ),
  Beauty: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 11V7l2-3 2 3v4" />
      <path d="M10 7l2-3 2 3v2h-4V7Z" fill="#ffec00" stroke="none" />
      <rect x="8" y="11" width="8" height="10" rx="3" />
      <line x1="10" y1="11" x2="14" y2="11" />
    </svg>
  ),
  Electronics: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 15V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8" />
      <path d="M3 15h18v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z" fill="#ffec00" stroke="currentColor" />
      <line x1="10" y1="17.5" x2="14" y2="17.5" stroke="currentColor" />
    </svg>
  ),
  Home: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 10l-2-6h12l-2 6 M8 10h8" />
      <path d="M8 10l-2-6h12l-2 6" />
      <path d="M8 10l-1-3h10l-1 3H8Z" fill="#ffec00" stroke="currentColor" />
      <line x1="12" y1="10" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  ),
  Appliances: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="6" width="16" height="10" rx="1" />
      <path d="M4 14h16v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1Z" fill="#ffec00" stroke="currentColor" />
      <path d="M8 20l4-3 4 3" />
    </svg>
  ),
  ToysBaby: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="14" r="5" />
      <circle cx="12" cy="14" r="2.5" fill="#ffec00" stroke="currentColor" />
      <circle cx="12" cy="7" r="3" />
      <circle cx="8" cy="5" r="2" />
      <circle cx="16" cy="5" r="2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <line x1="11" y1="7" x2="11.01" y2="7" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="7" x2="13.01" y2="7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  FoodHealth: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="8" y="4" width="8" height="3" rx="1" />
      <path d="M7 7h10v10a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V7Z" />
      <rect x="7" y="12" width="10" height="4" fill="#ffec00" stroke="currentColor" />
    </svg>
  ),
  AutoAccessories: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 18c0-5 2-10 6-10s6 3 6 10H6Z" />
      <path d="M12 8h3a3 3 0 0 1 3 3v4h-6V8Z" fill="#ffec00" stroke="currentColor" />
    </svg>
  ),
  TwoWheelers: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7" cy="16" r="3" fill="#ffec00" stroke="currentColor" />
      <circle cx="17" cy="16" r="3" fill="#ffec00" stroke="currentColor" />
      <path d="M7 13h5v-3h3l2 3h1.5" />
      <path d="M12 10L10 5" />
      <line x1="4" y1="13" x2="1" y2="13" />
    </svg>
  ),
  Sports: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 6L18 10L10 18L6 14L14 6Z" fill="white" />
      <path d="M18 10L20 8 M6 14L4 16" />
      <circle cx="8" cy="17" r="2.5" fill="#ffec00" stroke="currentColor" />
    </svg>
  ),
  Books: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="6" y="4" width="12" height="16" rx="1" />
      <path d="M6 4h3v16H6v-16Z" fill="#ffec00" stroke="currentColor" />
      <line x1="13" y1="8" x2="14" y2="8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Furniture: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
      <path d="M4 14H3v-3h1v3Z M21 14h-1v-3h1v3Z" />
      <path d="M6 14h12V9a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v5Z" fill="#ffec00" stroke="currentColor" />
    </svg>
  ),
  Contact: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M13 8H7M17 12H7" stroke="#ffec00" strokeWidth="2" />
    </svg>
  ),
  Privacy: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" fill="#ffec00" stroke="none" opacity="0.3" />
      <circle cx="12" cy="11" r="3" />
      <path d="M12 12v4" />
    </svg>
  )
};
