import { useEffect, useRef } from 'react';

interface VideoLoaderProps {
  onComplete: () => void;
}

export default function VideoLoader({ onComplete }: VideoLoaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // خطة بديلة (Fallback) أولية: إذا لم يتم تحميل الفيديو أو تشغيله بعد 5 ثوانٍ، ننهي شاشة التحميل
    fallbackTimerRef.current = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [onComplete]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      // بمجرد معرفة مدة الفيديو، نلغي المؤقت الافتراضي (5 ثوان)
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      
      const duration = videoRef.current.duration;
      // نضع مؤقت جديد يطابق مدة الفيديو الفعلية مع إضافة ثانية كاحتياط
      // هذا يضمن أن مدة التحميل ستتطابق تماماً مع الفديو
      if (isFinite(duration) && duration > 0) {
        fallbackTimerRef.current = setTimeout(() => {
          onComplete();
        }, duration * 1000 + 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain md:object-cover"
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        onError={onComplete}
        onLoadedMetadata={handleLoadedMetadata}
      >
        <source src="/loader-video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
