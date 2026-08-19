import { Directory, File, Paths } from 'expo-file-system';

import { reportError } from '../services/crashReporting';

// expo-image-picker only hands back a `uri` pointing at wherever the OS/picker put the
// asset (a temp cache path, or an `ph://` library reference) — nothing guarantees that
// location survives. Copying into our own app-sandboxed folder (organized by the date the
// photo was saved) makes every photo the app displays durable and independent of the
// picker's cache lifetime.
const PHOTOS_ROOT = 'pinpals-photos';

function todayFolder(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function randomFileId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Guards deletePhotoFile(s) against ever touching a file outside our own managed folder —
// callers may pass through uris that were never copied (e.g. a stale/legacy photoUri).
function isManagedPhotoUri(uri: string): boolean {
  return uri.includes(`/${PHOTOS_ROOT}/`);
}

export async function copyPhotoToAppStorage(sourceUri: string): Promise<string> {
  // Already ours — an edit flow re-saving a note hands back its existing photos alongside
  // newly picked ones, and copying those again would just duplicate files on disk.
  if (isManagedPhotoUri(sourceUri)) return sourceUri;

  const dir = new Directory(Paths.document, PHOTOS_ROOT, todayFolder());
  if (!dir.exists) dir.create({ intermediates: true });

  const sourceFile = new File(sourceUri);
  const destination = new File(dir, `${randomFileId()}${sourceFile.extension || '.jpg'}`);
  await sourceFile.copy(destination);
  return destination.uri;
}

export async function copyPhotosToAppStorage(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map(copyPhotoToAppStorage));
}

export function deletePhotoFile(uri: string | undefined | null): void {
  if (!uri || !isManagedPhotoUri(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (err) {
    // Best-effort cleanup — a missing/locked file shouldn't block the surrounding delete
    // flow, but repeated failures mean photos are piling up on disk, so they're reported.
    reportError('photoStorage', err, 'photo delete failed');
  }
}

export function deletePhotoFiles(uris: (string | undefined | null)[]): void {
  uris.forEach(deletePhotoFile);
}
