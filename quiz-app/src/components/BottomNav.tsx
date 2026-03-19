import { useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const NAV_ITEMS: { path: string; icon: ReactNode; label: string }[] = [
  {
    path: '/',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    label: '메인',
  },
  {
    path: '/leaderboard',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.44 4.97A5.99 5.99 0 0 0 11 15.93V18H8v2h8v-2h-3v-2.07a5.99 5.99 0 0 0 3.56-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
      </svg>
    ),
    label: '리더보드',
  },
  {
    path: '/wrong-notes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-7 h-7 fill-current">
        <path d="M280-280h84l240-238-86-86-238 238v86Zm352-266 42-44q6-6 6-14t-6-14l-56-56q-6-6-14-6t-14 6l-44 42 86 86ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h168q13-36 43.5-58t68.5-22q38 0 68.5 22t43.5 58h168q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm301.5-598.5Q510-807 510-820t-8.5-21.5Q493-850 480-850t-21.5 8.5Q450-833 450-820t8.5 21.5Q467-790 480-790t21.5-8.5ZM200-200v-560 560Z" />
      </svg>
    ),
    label: '오답노트',
  },
  {
    path: '/stats',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
        <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z" />
      </svg>
    ),
    label: '학습통계',
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMain = pathname === '/';

  return (
    <div className="bg-white border-t border-gray-100 px-6 py-3 safe-bottom">
      <div className="flex justify-around">
        {NAV_ITEMS.filter(({ path }) => path !== '/' || !isMain).map(({ path, icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 p-2 transition-all group ${active ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            >
              <div className={`transition-transform duration-200 group-hover:scale-125 group-active:scale-95 ${active ? 'scale-110' : ''}`}>
                {icon}
              </div>
              <span className={`text-xs font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
