import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { encodeBase64Url } from './abcCodec';
import type { AbcMetadata } from './abcMeta';
import { getFirebaseDb } from './firebase';

export type SavedMelody = {
  id: string;
  abc: string;
  title: string;
  key: string;
  meter: string;
  tempo: string;
  savedAt: string;
  category: string;
  note: string;
  updatedAt?: string;
};

export const MELODY_CATEGORIES = ['Uncategorized', 'Hook', 'Verse', 'Loop', 'BGM', 'Experimental'] as const;

export type MelodyCategory = (typeof MELODY_CATEGORIES)[number];

export type MelodyDetails = {
  category: string;
  note: string;
};

function normalizeCategory(category: string) {
  return MELODY_CATEGORIES.includes(category as MelodyCategory) ? category : 'Uncategorized';
}

function createId(abc: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < abc.length; index += 1) {
    hash ^= abc.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `m_${(hash >>> 0).toString(16)}`;
}

function melodiesCollection(userId: string) {
  return collection(getFirebaseDb(), 'users', userId, 'melodies');
}

function melodyDocument(userId: string, melodyId: string) {
  return doc(getFirebaseDb(), 'users', userId, 'melodies', melodyId);
}

export async function getSavedMelodies(userId: string): Promise<SavedMelody[]> {
  const snapshot = await getDocs(query(melodiesCollection(userId), orderBy('savedAt', 'desc')));
  return snapshot.docs.map((document) => {
    const melody = document.data() as SavedMelody;

    return {
      ...melody,
      category: normalizeCategory(melody.category ?? 'Uncategorized'),
      note: melody.note ?? '',
    };
  });
}

export async function isMelodySaved(userId: string, abc: string) {
  const snapshot = await getDoc(melodyDocument(userId, createId(abc)));
  return snapshot.exists();
}

export async function saveMelody(userId: string, abc: string, metadata: AbcMetadata, details?: MelodyDetails) {
  const melody: SavedMelody = {
    id: createId(abc),
    abc,
    title: metadata.title,
    key: metadata.key,
    meter: metadata.meter,
    tempo: metadata.tempo,
    savedAt: new Date().toISOString(),
    category: normalizeCategory(details?.category ?? 'Uncategorized'),
    note: details?.note.trim() ?? '',
  };

  await setDoc(melodyDocument(userId, melody.id), melody);
  return melody;
}

export async function removeSavedMelody(userId: string, id: string) {
  await deleteDoc(melodyDocument(userId, id));
}

export async function updateSavedMelodyDetails(
  userId: string,
  id: string,
  details: Pick<SavedMelody, 'category' | 'note'>,
) {
  const nextDetails = {
    category: normalizeCategory(details.category),
    note: details.note.trim(),
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(melodyDocument(userId, id), nextDetails);
  return nextDetails;
}

export function getMelodyUrl(melody: Pick<SavedMelody, 'abc'>) {
  return `/m?a=${encodeBase64Url(melody.abc)}`;
}
