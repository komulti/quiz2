import { useNavigate } from 'react-router-dom';

const logos = [
  {
    id: 1, name: '별빛 책',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#2563eb"/>
        <rect x="22" y="38" width="56" height="38" rx="4" fill="white" opacity="0.15"/>
        <rect x="22" y="38" width="56" height="38" rx="4" fill="none" stroke="white" strokeWidth="3"/>
        <line x1="50" y1="38" x2="50" y2="76" stroke="white" strokeWidth="2.5"/>
        <path d="M35 44 Q42 40 50 44" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M65 44 Q58 40 50 44" stroke="white" strokeWidth="2" fill="none"/>
        <polygon points="50,14 53,23 63,23 55,29 58,38 50,32 42,38 45,29 37,23 47,23" fill="#fbbf24"/>
      </svg>
    )
  },
  {
    id: 2, name: '합격 방패',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#059669"/>
        <path d="M50 18 L74 28 L74 52 Q74 68 50 80 Q26 68 26 52 L26 28 Z" fill="white" opacity="0.2"/>
        <path d="M50 18 L74 28 L74 52 Q74 68 50 80 Q26 68 26 52 L26 28 Z" fill="none" stroke="white" strokeWidth="3"/>
        <polyline points="36,50 46,60 64,40" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 3, name: '퀴즈 Q',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#7c3aed"/>
        <circle cx="48" cy="46" r="22" fill="none" stroke="white" strokeWidth="7"/>
        <line x1="63" y1="61" x2="78" y2="76" stroke="white" strokeWidth="7" strokeLinecap="round"/>
        <text x="48" y="53" textAnchor="middle" fill="white" fontSize="20" fontWeight="900" fontFamily="Arial">?</text>
      </svg>
    )
  },
  {
    id: 4, name: '로켓 발사',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#dc2626"/>
        <path d="M50 20 C50 20 68 30 68 52 L68 64 L50 74 L32 64 L32 52 C32 30 50 20 50 20Z" fill="white" opacity="0.9"/>
        <circle cx="50" cy="50" r="8" fill="#dc2626"/>
        <path d="M32 64 L24 76 L36 72Z" fill="#fbbf24"/>
        <path d="M68 64 L76 76 L64 72Z" fill="#fbbf24"/>
        <rect x="44" y="70" width="12" height="10" rx="2" fill="#fbbf24"/>
      </svg>
    )
  },
  {
    id: 5, name: '트로피',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#d97706"/>
        <path d="M34 24 L66 24 L66 50 Q66 68 50 72 Q34 68 34 50Z" fill="#fbbf24"/>
        <path d="M34 30 L24 30 Q20 30 20 40 Q20 50 34 50" fill="none" stroke="#fbbf24" strokeWidth="5"/>
        <path d="M66 30 L76 30 Q80 30 80 40 Q80 50 66 50" fill="none" stroke="#fbbf24" strokeWidth="5"/>
        <rect x="44" y="72" width="12" height="8" fill="#fbbf24"/>
        <rect x="34" y="80" width="32" height="5" rx="2.5" fill="#fbbf24"/>
        <polygon points="50,32 52,38 58,38 53,42 55,48 50,44 45,48 47,42 42,38 48,38" fill="white"/>
      </svg>
    )
  },
  {
    id: 6, name: '연필 + 별',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#0891b2"/>
        <rect x="44" y="22" width="14" height="52" rx="4" fill="white" transform="rotate(-30 50 50)"/>
        <polygon points="50,22 53,30 62,30 55,35 58,43 50,38 42,43 45,35 38,30 47,30" fill="#fbbf24" transform="rotate(-30 50 50) translate(0,-8)"/>
        <polygon points="72,62 74,68 80,68 75,71 77,77 72,74 67,77 69,71 64,68 70,68" fill="#fbbf24" opacity="0.8"/>
        <polygon points="28,28 29,32 33,32 30,34 31,38 28,36 25,38 26,34 23,32 27,32" fill="#fbbf24" opacity="0.6"/>
      </svg>
    )
  },
  {
    id: 7, name: '원형 체크',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#1e40af"/>
        <circle cx="50" cy="48" r="28" fill="none" stroke="white" strokeWidth="5" strokeDasharray="88 176" strokeDashoffset="44"/>
        <circle cx="50" cy="48" r="28" fill="none" stroke="#fbbf24" strokeWidth="5" strokeDasharray="88 176" strokeDashoffset="-44"/>
        <polyline points="36,48 46,58 64,38" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 8, name: '번개 퀴즈',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#4f46e5"/>
        <polygon points="58,18 36,52 52,52 42,82 72,44 54,44" fill="#fbbf24"/>
        <polygon points="58,18 36,52 52,52 42,82 72,44 54,44" fill="none" stroke="white" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 9, name: '졸업모',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" rx="22" fill="#be185d"/>
        <polygon points="50,25 80,40 50,55 20,40" fill="white"/>
        <path d="M65 47 L65 65 Q65 72 50 76 Q35 72 35 65 L35 47" fill="white" opacity="0.85"/>
        <line x1="80" y1="40" x2="80" y2="58" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="80" cy="61" r="4" fill="#fbbf24"/>
        <polygon points="50,36 51.5,41 56.5,41 52.5,44 54,49 50,46 46,49 47.5,44 43.5,41 48.5,41" fill="#be185d" opacity="0.5"/>
      </svg>
    )
  },
  {
    id: 10, name: '별 5개 그라데이션',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="grad10" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#8b5cf6"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#grad10)"/>
        <polygon points="50,18 53.5,29 65,29 56,36 59.5,47 50,40 40.5,47 44,36 35,29 46.5,29" fill="#fbbf24"/>
        <text x="50" y="68" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="'Noto Sans KR', sans-serif">퀴즈 챌린지</text>
        <text x="50" y="82" textAnchor="middle" fill="white" fontSize="8" fontFamily="'Noto Sans KR', sans-serif" opacity="0.8">검정고시</text>
      </svg>
    )
  },
];

export default function LogoPreviewPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500">←</button>
        <h1 className="text-lg font-bold text-gray-800">로고 미리보기</h1>
      </div>
      <div className="flex-1 px-4 py-5">
        <p className="text-sm text-gray-400 mb-4 text-center">마음에 드는 로고 번호를 알려주세요</p>
        <div className="grid grid-cols-2 gap-4">
          {logos.map((logo) => (
            <div key={logo.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3">
              <div className="w-20 h-20">{logo.svg}</div>
              <p className="text-xs font-bold text-gray-600">#{logo.id} {logo.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
