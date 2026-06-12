// icons.jsx — line-style icon set (stroke = currentColor)
const Ic = (() => {
  const S = ({ children, size = 20, sw = 1.8, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>
      {children}
    </svg>
  );
  return {
    grid: (p) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></S>,
    wallet: (p) => <S {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v0H5a2 2 0 0 0-2 2"/><path d="M3 9v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5"/><circle cx="16.5" cy="13" r="1.2" fill="currentColor" stroke="none"/></S>,
    sun: (p) => <S {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></S>,
    moon: (p) => <S {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></S>,
    calDay: (p) => <S {...p}><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/><rect x="7" y="12" width="6" height="5" rx="1" fill="currentColor" stroke="none" opacity="0.35"/></S>,
    calWeek: (p) => <S {...p}><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4M8 13v4M12 13v4M16 13v4"/></S>,
    calMonth: (p) => <S {...p}><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4M7 13h.01M11 13h.01M15 13h.01M7 17h.01M11 17h.01M15 17h.01"/></S>,
    kanban: (p) => <S {...p}><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M8 7v7M12 7v4M16 7v9"/></S>,
    target: (p) => <S {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></S>,
    flame: (p) => <S {...p}><path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.5-2 1-2.5C9 10 9 8 12 3Z"/><path d="M12 21a4 4 0 0 0 4-4c0-2-2-3-4-6"/></S>,
    plus: (p) => <S {...p}><path d="M12 5v14M5 12h14"/></S>,
    bell: (p) => <S {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></S>,
    search: (p) => <S {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></S>,
    check: (p) => <S {...p}><path d="M20 6 9 17l-5-5"/></S>,
    chevL: (p) => <S {...p}><path d="m15 18-6-6 6-6"/></S>,
    chevR: (p) => <S {...p}><path d="m9 18 6-6-6-6"/></S>,
    chevD: (p) => <S {...p}><path d="m6 9 6 6 6-6"/></S>,
    arrowUp: (p) => <S {...p}><path d="M12 19V5M5 12l7-7 7 7"/></S>,
    arrowDown: (p) => <S {...p}><path d="M12 5v14M5 12l7 7 7-7"/></S>,
    clock: (p) => <S {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></S>,
    pin: (p) => <S {...p}><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></S>,
    dots: (p) => <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></S>,
    settings: (p) => <S {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7.7 1.6 1.6 0 0 0-1.6 1.3H12a2 2 0 0 1-2-2v-.1a1.6 1.6 0 0 0-2.7-.7 2 2 0 1 1-2.8-2.8 1.6 1.6 0 0 0-.3-2.6 1.6 1.6 0 0 0-1.6-1.3V12a2 2 0 0 1 2-2h.1a1.6 1.6 0 0 0 .7-2.7 2 2 0 1 1 2.8-2.8 1.6 1.6 0 0 0 2.6.3H12a1.6 1.6 0 0 0 1-1.6V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7.7 2 2 0 1 1 2.8 2.8 1.6 1.6 0 0 0 .3 2.6Z"/></S>,
    droplet: (p) => <S {...p}><path d="M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10Z"/></S>,
    dumbbell: (p) => <S {...p}><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/></S>,
    book: (p) => <S {...p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 0 2 2h12"/></S>,
    leaf: (p) => <S {...p}><path d="M4 20s1-9 9-13c4-2 7-2 7-2s0 3-2 7c-4 8-13 9-13 9Z"/><path d="M4 20c3-6 7-9 12-11"/></S>,
    salad: (p) => <S {...p}><path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M11 7a3 3 0 0 1 3-3M9 8a4 4 0 0 1 1-5M13 8c1-2 3-2 4-1"/></S>,
    heart: (p) => <S {...p}><path d="M12 20s-7-4.4-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z"/></S>,
    rings: (p) => <S {...p}><circle cx="9" cy="14" r="5"/><circle cx="15" cy="11" r="5"/></S>,
    plane: (p) => <S {...p}><path d="M2 12 22 4l-4 18-5-7-7-1Z"/></S>,
    car: (p) => <S {...p}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z"/><circle cx="7.5" cy="15.5" r="0.6" fill="currentColor" stroke="none"/><circle cx="16.5" cy="15.5" r="0.6" fill="currentColor" stroke="none"/></S>,
    shield: (p) => <S {...p}><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/></S>,
    cap: (p) => <S {...p}><path d="M3 9l9-4 9 4-9 4-9-4Z"/><path d="M7 11v4c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4"/></S>,
    cart: (p) => <S {...p}><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h7.5a1 1 0 0 0 1-.8L20 7H6"/></S>,
    bus: (p) => <S {...p}><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M8 17v2M16 17v2"/><circle cx="8" cy="14" r="0.6" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="0.6" fill="currentColor" stroke="none"/></S>,
    paw: (p) => <S {...p}><circle cx="6" cy="11" r="1.6"/><circle cx="10" cy="8" r="1.6"/><circle cx="14" cy="8" r="1.6"/><circle cx="18" cy="11" r="1.6"/><path d="M8 16c0-2 1.8-3.5 4-3.5S16 14 16 16s-1 2.5-4 2.5S8 18 8 16Z"/></S>,
    tv: (p) => <S {...p}><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/></S>,
    sparkle: (p) => <S {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/></S>,
    logout: (p) => <S {...p}><path d="M15 12H4M9 7l-5 5 5 5M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/></S>,
    edit: (p) => <S {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></S>,
    trash: (p) => <S {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></S>,
    filter: (p) => <S {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/></S>,
    receipt: (p) => <S {...p}><path d="M5 3h14v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></S>,
    sync: (p) => <S {...p}><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.5-4M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.5 4"/><path d="M21 4v4h-4M3 20v-4h4"/></S>,
    link: (p) => <S {...p}><path d="M9 15l6-6M10.5 6.5l1-1a4 4 0 0 1 6 6l-1 1M13.5 17.5l-1 1a4 4 0 0 1-6-6l1-1"/></S>,
  };
})();
window.Ic = Ic;
