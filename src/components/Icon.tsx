const paths: Record<string, string> = {
  store: "M3 9l1.5-5h15L21 9M3 9h18M3 9v11h18V9M9 20v-6h6v6",
  zap: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  truck: "M1 7h13v9H1zM14 10h4l3 3v3h-7zM5 19a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z",
  phone: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z",
  check: "M20 6L9 17l-5-5",
  arrow: "M5 12h14M13 5l7 7-7 7",
  pin: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  mail: "M4 4h16v16H4zM4 4l8 8 8-8",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  box: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v9",
  euro: "M18 7a7 7 0 100 10M4 10h10M4 14h10",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  user: "M20 21a8 8 0 10-16 0M12 13a4 4 0 100-8 4 4 0 000 8z",
  building: "M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M4 21h16M16 9h2a2 2 0 012 2v10M8 7h2M8 11h2M8 15h2M12 7h1M12 11h1M12 15h1",
  calendar: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",
  lock: "M6 11h12v10H6zM9 11V7a3 3 0 016 0v4",
  star: "M12 3l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4 6.3 20.5l1.2-6.4L2.8 9.7l6.4-.8z",
  info: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 11v5M12 8h.01",
  alert: "M12 3l10 18H2zM12 10v4M12 17h.01",
  chat: "M4 5h16v11H9l-5 4z",
  route: "M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a3 3 0 013-3h2M18 9v6a3 3 0 01-3 3h-2",
  handshake: "M4 12l4-4 4 3 4-3 4 4-3 3-3-2-2 3-3-1-2-2zM2 10l2 2M22 10l-2 2",
  chevron: "M9 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  stairs: "M4 20h4v-4h4v-4h4V8h4",
  elevator: "M5 3h14v18H5zM9 10l3-3 3 3M9 14l3 3 3-3",
  people: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
};

export function Icon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const d = paths[name] ?? paths.box;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
