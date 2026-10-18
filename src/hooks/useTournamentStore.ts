import { useEffect, useState } from 'react';
import { store, TournamentStore } from '../services/store';

export function useTournamentStore(): TournamentStore {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  return store;
}
