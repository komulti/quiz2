import { useState, useRef, useCallback } from 'react';

interface Props {
  src: string;
  alt: string;
}

export default function QuestionImage({ src, alt }: Props) {
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scale, setScale] = useState(1);

  // pinch-zoom state
  const lastDist = useRef<number | null>(null);
  const lastScale = useRef(1);

  const imgBase = src.replace(/\.png$/, '');
  const base = import.meta.env.BASE_URL;
  const webpSrc = `${base}data/${imgBase}.webp`;
  const pngSrc  = `${base}data/${src}`;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.hypot(dx, dy);
      lastScale.current = scale;
    }
  }, [scale]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.max(1, Math.min(4, lastScale.current * (dist / lastDist.current)));
      setScale(newScale);
    }
  }, []);

  const onDoubleClick = useCallback(() => {
    setScale((s) => (s > 1 ? 1 : 2));
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setScale(1);
  };

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
            className="w-full rounded-xl object-contain max-h-72 bg-white border border-gray-100"
          />
        </picture>
        <p className="text-xs text-gray-400 text-center mt-1 select-none">탭하여 확대 🔍</p>
      </button>

      {/* 전체화면 이미지 모달 */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center image-modal-bg bg-black/75"
          onClick={closeModal}
        >
          <div
            className="relative w-full h-full flex items-center justify-center overflow-auto"
            onClick={closeModal}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onDoubleClick={onDoubleClick}
          >
            <picture>
              <source srcSet={webpSrc} type="image/webp" />
              <img
                src={pngSrc}
                alt={alt}
                className="max-w-full object-contain rounded-xl transition-transform duration-100 select-none"
                style={{
                  transform: `scale(${scale})`,
                  maxHeight: '90dvh',
                  touchAction: 'none',
                }}
                draggable={false}
              />
            </picture>
          </div>
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={closeModal}
            aria-label="이미지 닫기"
          >
            ×
          </button>
          <p className="absolute top-4 text-white/80 text-sm font-medium select-none bg-black/30 px-4 py-1.5 rounded-full">
            더블탭 또는 핀치로 확대/축소
          </p>
        </div>
      )}
    </>
  );
}
