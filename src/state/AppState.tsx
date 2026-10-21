import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PortfolioRecord } from '../types';
import {
  createRecord,
  loadPortfolio,
  savePortfolio,
  type NewRecordInput,
} from '../lib/portfolio/storage';
import { reference } from '../data/reference';

interface AppStateValue {
  records: PortfolioRecord[];
  addRecord: (input: NewRecordInput) => PortfolioRecord;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
  locationId: string;
  setLocationId: (id: string) => void;
  storageAvailable: boolean;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const LOCATION_KEY = 'valuasi-ekosistem.location.v1';

function initialLocation(): string {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(LOCATION_KEY);
      if (saved && reference.locations.some((location) => location.id === saved)) {
        return saved;
      }
    } catch {
      // Storage can be blocked by browser privacy settings; use the default.
    }
  }
  return reference.locations[0]?.id ?? '';
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PortfolioRecord[]>(() => loadPortfolio());
  const [locationId, setLocationIdState] = useState<string>(() => initialLocation());
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      const probe = '__valuasi_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, []);

  useEffect(() => {
    savePortfolio(records);
  }, [records]);

  const setLocationId = useCallback((id: string) => {
    setLocationIdState(id);
    try {
      window.localStorage.setItem(LOCATION_KEY, id);
    } catch {
      // Preference cannot be persisted; the session still works.
    }
  }, []);

  const addRecord = useCallback((input: NewRecordInput) => {
    const record = createRecord(input);
    setRecords((current) => [record, ...current]);
    return record;
  }, []);

  const removeRecord = useCallback((id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  }, []);

  const clearRecords = useCallback(() => {
    setRecords([]);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      records,
      addRecord,
      removeRecord,
      clearRecords,
      locationId,
      setLocationId,
      storageAvailable,
    }),
    [records, addRecord, removeRecord, clearRecords, locationId, setLocationId, storageAvailable],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
