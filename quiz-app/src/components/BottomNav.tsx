import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/',            icon: '🏠', label: '메인' },
  { path: '/leaderboard', icon: '🏆', label: '리더보드' },
  { path: '/wrong-notes', icon: '📝', label: '오답노트' },
  { path: '/stats',       icon: '📊', label: '학습통계' },
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
              <span className={`text-2xl transition-transform duration-200 group-hover:scale-125 group-active:scale-95 ${active ? 'scale-110' : ''}`}>{icon}</span>
              <span className={`text-xs font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
