
// ============================================================
// useRealtimeSync.ts
// Hook de sincronização em tempo real para o Painel de Voos.
//
// Estratégia (compatível com Google Sheets / Apps Script):
//  1. Polling periódico (intervalo configurável, padrão 30s)
//  2. Page Visibility API — atualiza imediatamente ao voltar para a aba/app
//  3. BroadcastChannel — sincroniza entre abas do mesmo browser e PWA
//  4. Backoff exponencial — reduz chamadas quando a API está lenta
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react';

const CHANNEL_NAME = 'torre-de-controle-sync';

export interface SyncState {
  lastSync: Date | null;
  nextSyncIn: number;         // segundos até próxima atualização
  isSyncing: boolean;
  errorCount: number;
}

interface UseRealtimeSyncOptions {
  intervalMs?: number;        // intervalo base de polling (padrão: 30s)
  maxBackoffMs?: number;      // backoff máximo em caso de erro (padrão: 5min)
  enabled?: boolean;          // habilitar/desabilitar
  onSync: () => Promise<void>; // função que busca os dados
}

export function useRealtimeSync({
  intervalMs = 30_000,
  maxBackoffMs = 300_000,
  enabled = true,
  onSync,
}: UseRealtimeSyncOptions): SyncState {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [nextSyncIn, setNextSyncIn] = useState(intervalMs / 1000);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  // ── Calcula o intervalo com backoff exponencial ──────────────
  const getInterval = useCallback((errors: number) => {
    if (errors === 0) return intervalMs;
    const backoff = Math.min(intervalMs * Math.pow(2, errors), maxBackoffMs);
    return backoff;
  }, [intervalMs, maxBackoffMs]);

  // ── Executa a sincronização ──────────────────────────────────
  const runSync = useCallback(async (broadcast = true) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      await onSyncRef.current();
      const now = new Date();
      setLastSync(now);
      setErrorCount(0);

      // Notifica outras abas / PWA
      if (broadcast && channelRef.current) {
        try {
          channelRef.current.postMessage({ type: 'SYNC_COMPLETE', ts: now.toISOString() });
        } catch { /* channel pode estar fechado */ }
      }
    } catch {
      setErrorCount(prev => prev + 1);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // ── Agenda o próximo ciclo de sync ───────────────────────────
  const scheduleNext = useCallback((errors: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const delay = getInterval(errors);
    let remaining = Math.round(delay / 1000);
    setNextSyncIn(remaining);

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setNextSyncIn(Math.max(0, remaining));
    }, 1000);

    timerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      runSync(true).then(() => {
        setErrorCount(c => {
          scheduleNext(c);
          return c;
        });
      });
    }, delay);
  }, [getInterval, runSync]);

  // ── Page Visibility API ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Ao voltar para a aba: sincroniza imediatamente se passou mais de 15s
        const elapsed = lastSync ? Date.now() - lastSync.getTime() : Infinity;
        if (elapsed > 15_000) {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          runSync(true).then(() => scheduleNext(0));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [enabled, lastSync, runSync, scheduleNext]);

  // ── BroadcastChannel (cross-tab / PWA sync) ─────────────────
  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (e) => {
      if (e.data?.type === 'SYNC_COMPLETE') {
        // Outra aba sincronizou — atualiza sem chamar a API de novo
        setLastSync(new Date(e.data.ts));
        // Reinicia o countdown
        if (timerRef.current) clearTimeout(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        // Agenda o próximo sync a partir do momento atual
        scheduleNext(0);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [enabled, scheduleNext]);

  // ── Bootstrap: primeira execução + agendamento inicial ───────
  useEffect(() => {
    if (!enabled) return;

    runSync(true).then(() => scheduleNext(0));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // Executa apenas quando enabled muda
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { lastSync, nextSyncIn, isSyncing, errorCount };
}
