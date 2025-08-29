import * as React from "react"

const MOBILE_BREAKPOINT = 768

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  supportsTouch: boolean;
  supportsHover: boolean;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    screenWidth: 1920,
    screenHeight: 1080,
    devicePixelRatio: 1,
    supportsTouch: false,
    supportsHover: true,
  })

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Device type detection
      const isMobile = screenWidth < MOBILE_BREAKPOINT;
      const isTablet = screenWidth >= MOBILE_BREAKPOINT && screenWidth < 1024;
      const isDesktop = screenWidth >= 1024;
      
      // Platform detection
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      
      // Capability detection
      const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const supportsHover = window.matchMedia('(hover: hover)').matches;
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        screenWidth,
        screenHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        supportsTouch,
        supportsHover,
      });
    };

    // Initial detection
    updateDeviceInfo();

    // Listen for window resize
    const handleResize = () => updateDeviceInfo();
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation change on mobile
    const handleOrientationChange = () => {
      // Delay to get accurate dimensions after orientation change
      setTimeout(updateDeviceInfo, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
}

// Simpler hook for backward compatibility
export function useIsMobile() {
  const { isMobile } = useDeviceDetection();
  return isMobile;
}
