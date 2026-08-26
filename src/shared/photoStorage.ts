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

// The avatar a provider hands over is a remote URL (only Google supplies one — Apple never
// does). Storing that URL as the profile avatar meant fetching it from Google's CDN on every
// render, a blank avatar whenever the device was offline, and a permanently broken image once
// the URL rotated — which it does whenever the person changes their Google account photo.
// Downloading it once makes the stored avatar an ordinary local file like a picked photo.
//
// Returns the remote URL unchanged if the download fails: that is the old behaviour, still
// better than no avatar, and Avatar falls back to initials if it can't be shown either.
export async function downloadAvatarToAppStorage(remoteUrl: string): Promise<string> {
  if (!remoteUrl.startsWith('http')) return remoteUrl;
  try {
    const dir = new Directory(Paths.document, PHOTOS_ROOT, 'avatars');
    if (!dir.exists) dir.create({ intermediates: true });
    const file = await File.downloadFileAsync(remoteUrl, dir);
    return file.uri;
  } catch (err) {
    reportError('photoStorage', err, 'avatar download failed');
    return remoteUrl;
  }
}

// iOS hands the app a new container UUID on every reinstall, and its path is part of every
// absolute file:// uri we save. The files survive — Documents is preserved — but every stored
// path points at a directory that no longer exists, so photos silently render as nothing.
// (In development this fires constantly, since each `expo run:ios` reinstalls.)
//
// Rather than store absolute paths and hope, this re-anchors anything under our own photo
// folder to wherever Documents lives right now. Applied when the store rehydrates, so every
// render site keeps working with plain uris and none of them has to know about this.
export function reanchorPhotoUri<T extends string | undefined | null>(uri: T): T {
  if (!uri) return uri;
  const marker = `/${PHOTOS_ROOT}/`;
  const index = uri.indexOf(marker);
  if (index === -1) return uri;

  const relative = uri.slice(index + 1); // "pinpals-photos/2026-08-26/abc.jpg"
  const current = new File(Paths.document, relative).uri;
  return (current === uri ? uri : current) as T;
}

export function reanchorPhotoUris(uris: string[] | undefined): string[] | undefined {
  return uris?.map((uri) => reanchorPhotoUri(uri));
}
