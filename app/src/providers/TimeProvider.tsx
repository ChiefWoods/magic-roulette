"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

interface TimeContextType {
  time: Date;
}

const TimeContextType = createContext<TimeContextType>({} as TimeContextType);

export function useTime() {
  return useContext(TimeContextType);
}

export function TimeProvider({ children }: { children: ReactNode }) {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const value = useMemo(() => ({ time }), [time]);

  return <TimeContextType.Provider value={value}>{children}</TimeContextType.Provider>;
}
