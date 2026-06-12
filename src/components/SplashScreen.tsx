import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    // Auto-dismiss after 1.8s
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 300);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const handleClick = () => {
    setIsVisible(false);
    setTimeout(onFinish, 200);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{ backgroundColor: '#f1eef6' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={handleClick}
        >
          <motion.img
            src="/splash-bg.png"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setImgLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: imgLoaded ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />

          {/* Skip hint */}
          <motion.p
            className="absolute bottom-10 text-[#7b6bc8] text-xs tracking-widest z-10 font-medium"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            点击任意位置进入
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
