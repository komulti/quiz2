import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  src: string;
  alt: string;
}

export default function QuestionImage({ src, alt }: Props) {
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // transform 값을 ref로만 관리 (리렌더링 없이 DOM 직접 업데이트)
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });

  // pinch-zoom refs
  const lastDist = useRef<number | null>(null);
  const lastScale = useRef(1);
  // pan refs
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const imgBase = src.replace(/\.png$/, '');
  const base = import.meta.env.BASE_URL;
  const webpSrc = `${base}data/${imgBase}.webp`;
  const pngSrc  = `${base}data/${src}`;

  const applyTransform = (animated = false) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const img = imgRef.current;
      if (!img) return;
      img.style.transition = animated ? 'transform 0.15s ease' : 'none';
      img.style.transform = `translate(${translateRef.current.x}px, ${translateRef.current.y}px) scale(${scaleRef.current})`;
    });
  };

  const resetTransform = () => {
    scaleRef.current = 1;
    translateRef.current = { x: 0, y: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const img = imgRef.current;
    if (img) { img.style.transition = 'none'; img.style.transform = ''; }
  };

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
        scaleRef.current = newScale;
        if (newScale <= 1) translateRef.current = { x: 0, y: 0 };
        applyTransform(false);
      } else if (e.touches.length === 1 && lastTouch.current && scaleRef.current > 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastTouch.current.x;
        const dy = e.touches[0].clientY - lastTouch.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateRef.current = { x: translateRef.current.x + dx, y: translateRef.current.y + dy };
        applyTransform(false);
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
    if (scaleRef.current > 1) {
      resetTransform();
    } else {
      scaleRef.current = 2;
      applyTransform(true);
    }
  }, []);

  const handleModalClick = useCallback(() => {
    if (isDragging.current) { isDragging.current = false; return; }
    setModalOpen(false);
    resetTransform();
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
        <p className="text-xs font-semibold text-blue-400 text-center mt-1.5 select-none tracking-wide">🔍 탭하여 확대</p>
      </button>

      {/* 전체화면 이미지 모달 */}
      {modalOpen && (
        <>
          {/* 이미지 영역 */}
          <div
            ref={containerRef}
            className="fixed top-0 inset-x-0 z-50 bg-black/90"
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
                  ref={imgRef}
                  src={pngSrc}
                  alt={alt}
                  onClick={handleModalClick}
                  className="w-full rounded-xl select-none"
                  style={{ touchAction: 'none', transformOrigin: 'top center', willChange: 'transform' }}
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
