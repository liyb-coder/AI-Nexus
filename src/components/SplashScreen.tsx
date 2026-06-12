import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onFinishRef.current(), 300);
    }, 1800);
    return () => clearTimeout(timer);
  }, []); // empty deps — run once only

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden cursor-pointer"
          style={{ backgroundColor: '#f1eef6' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={() => { setIsVisible(false); setTimeout(() => onFinishRef.current(), 200); }}
        >
          <img
            src="/splash-bg.png"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <p className="absolute bottom-10 text-[#7b6bc8] text-xs tracking-widest z-10 font-medium">
            点击任意位置进入
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
