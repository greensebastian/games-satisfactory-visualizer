import { useEffect, useState } from "react";

export function useDelay(ms: number = 0) {
  // Hack because of move on creation
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return visible;
}
