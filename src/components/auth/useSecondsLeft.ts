import { useEffect, useState } from 'react';

/** Hitung mundur detik menuju `until` (ms epoch). 0 bila sudah lewat. */
export function useSecondsLeft(until: number): number {
  const calc = () => Math.max(0, Math.ceil((until - Date.now()) / 1000));
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (until <= Date.now()) return;
    const id = setInterval(() => {
      const v = calc();
      setLeft(v);
      if (v <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);

  return left;
}
