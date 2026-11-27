import type { Timestamp } from 'firebase/firestore';

export function formatDate(ts: Timestamp): string {
  return ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export function normaliser(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}