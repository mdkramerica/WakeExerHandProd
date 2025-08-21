import { useRef, useEffect } from 'react';

interface VideoDemoProps {
  className?: string;
}

export default function VideoDemo({ className = "w-full h-48" }: VideoDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Ensure video properties are set
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      
      // Handle video load and play
      const handleLoadedData = () => {
        video.play().catch(console.log);
      };

      video.addEventListener('loadeddata', handleLoadedData);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, []);

  return (
    <div className={`relative ${className} bg-gray-900 rounded-lg overflow-hidden border border-gray-700`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        loop
        autoPlay
        playsInline
        onError={(e) => {
          console.log('Video error:', e);
        }}
        src="/hand-tracking-demo.mov"
      >
        Your browser does not support the video tag.
      </video>
      
      {/* Fallback for video loading issues */}
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center" 
           style={{ display: 'none' }} 
           id="video-fallback">
        <div className="text-center text-white">
          <div className="text-lg font-semibold mb-2">Hand Tracking Demo</div>
          <div className="text-sm opacity-75">Loading your motion analysis video...</div>
        </div>
      </div>
      
      {/* Video overlay with demo information */}
      <div className="absolute top-2 left-2 bg-black/70 px-3 py-1 rounded text-xs text-white">
        Real-Time Motion Analysis Demo
      </div>
      
      <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded text-xs text-white">
        Precision 21-joint biomechanical tracking
      </div>
    </div>
  );
}