import type { Timestamp } from 'firebase/firestore';

export function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
