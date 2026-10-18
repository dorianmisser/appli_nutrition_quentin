export type IconName = 'plan' | 'pantry' | 'history' | 'profile' | 'star' | 'starFilled' | 'bell' | 'play' | 'check' | 'skip' | 'trash' | 'print';

const paths: Record<IconName, string> = {
  plan: 'M3 12h4l3-8 4 16 3-8h4',
  pantry: 'M6 3h12l-1 5H7L6 3Zm1 5v13h10V8M10 12h4',
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3 2',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z',
  starFilled: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z',
  bell: 'M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Zm4 11a2 2 0 0 0 4 0',
  play: 'M7 4v16l13-8L7 4Z',
  check: 'm4 12 5 5L20 6',
  skip: 'M5 5l8 7-8 7V5Zm12 0v14',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  print: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7v-7Z',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const filled = name === 'starFilled';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
