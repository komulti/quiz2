import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  src: string;
  alt: string;
}

export default function QuestionImage({ src, alt }: Props) {
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // refs for non-passive handlers
  const lastDist = useRef<number | null>(null);
  const lastScale = useRef(1);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const imgBase = src.replace(/\.png$/, '');
  const base = import.meta.env.BASE_URL;
  const webpSrc = `${base}data/${imgBase}.webp`;
  const pngSrc  = `${base}data/${src}`;

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // non-passive touch 리스너 (핀치 줌 + 드래그 pan)
  useEffect(() => {
    if (!modalOpen) return;
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastTouch.current = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDist.current = Math.hypot(dx, dy);
        lastScale.current = scaleRef.current;
      } else if (e.touches.length === 1) {
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDragging.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDist.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const newScale = Math.max(1, Math.min(4, lastScale.current * (dist / lastDist.current)));
        setScale(newScale);
      } else if (e.touches.length === 1 && lastTouch.current && scaleRef.current > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastTouch.current.x;
        const dy = e.touches[0].clientY - lastTouch.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
    };

    const handleTouchEnd = () => {
      lastDist.current = null;
      lastTouch.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [modalOpen]);

  const onDoubleClick = useCallback(() => {
    setScale((s) => {
      if (s > 1) { setTranslate({ x: 0, y: 0 }); return 1; }
      return 2;
    });
  }, []);

  const handleModalClick = useCallback(() => {
    if (isDragging.current) { isDragging.current = false; return; }
    setModalOpen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  if (error) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center py-10 text-gray-400 text-sm"
      >
        🖼️ 이미지를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
        aria-label={`${alt} — 탭하여 확대`}
      >
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={pngSrc}
            alt={alt}
            loading="lazy"
            onError={() => setError(true)}
            className="w-full rounded-xl object-contain bg-white border border-gray-100"
          />
        </picture>
        <p className="text-xs text-gray-400 text-center mt-1 select-none">탭하여 확대 🔍</p>
      </button>

      {/* 전체화면 이미지 모달 */}
      {modalOpen && (
        <>
          {/* 이미지 영역 */}
          <div
            ref={containerRef}
            className="fixed top-0 inset-x-0 z-50 bg-black/90 overflow-hidden"
            onClick={handleModalClick}
            onDoubleClick={onDoubleClick}
          >
            <div className="flex flex-col items-center gap-3 px-3 pt-14 pb-4 w-full">
              <p className="text-white/80 text-sm font-medium select-none bg-black/30 px-3 py-1 rounded-full">
                핀치로 확대/축소 · 드래그로 이동
              </p>
              <picture>
                <source srcSet={webpSrc} type="image/webp" />
                <img
                  src={pngSrc}
                  alt={alt}
                  onClick={handleModalClick}
                  className="w-full rounded-xl transition-transform duration-100 select-none"
                  style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                    transformOrigin: 'top center',
                    touchAction: 'none',
                  }}
                  draggable={false}
                />
              </picture>
            </div>
          </div>
          {/* 이미지 아래 투명 오버레이 (탭하면 닫힘) */}
          <div className="fixed inset-0 z-40" onClick={handleModalClick} />
          {/* X 버튼 */}
          <button
            className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={handleModalClick}
            aria-label="이미지 닫기"
          >
            ×
          </button>
        </>
      )}
    </>
  );
}
