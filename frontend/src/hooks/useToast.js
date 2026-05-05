import { useEffect, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration });
  };

  const closeToast = () => {
    setToast(null);
  };

  return { showToast, closeToast, toast };
}
