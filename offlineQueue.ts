const QUEUE_KEY = 'sync_queue_v2';

export interface QueuedAction {
  id: string;
  body: object;
  timestamp: number;
}

export function getSyncQueue(): QueuedAction[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function enqueueAction(body: object) {
  const queue = getSyncQueue();
  queue.push({
    id: crypto.randomUUID(),
    body,
    timestamp: Date.now()
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearSyncQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function removeActionFromQueue(id: string) {
  const queue = getSyncQueue();
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter(a => a.id !== id)));
}
