/**
 * Picking images from the device, for the application forms' photo and student-ID
 * uploads. The website uses a hidden `<input type="file">`; on mobile the equivalent
 * is expo-image-picker, which handles the OS permission prompt itself.
 *
 * Both helpers return LOCAL file URIs. Nothing is persisted until the caller hands the
 * URI to `uploadApi.file()` — the listing only ever stores the uploaded URL.
 */
import * as ImagePicker from 'expo-image-picker';

/** One picked image, in the shape the upload helper wants. */
export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

/** What the backend's upload filter accepts. Anything else is rejected outright. */
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

function toPicked(asset: ImagePicker.ImagePickerAsset): PickedImage {
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  // iOS reports `image/heic` for camera-roll photos, which the backend rejects. Passing
  // `quality` below makes the picker hand back a re-encoded JPEG regardless, so the
  // honest label for those bytes is image/jpeg — normalise rather than forward a type
  // that would fail the upload.
  const reported = asset.mimeType ?? '';
  const type = ALLOWED.has(reported) ? reported : 'image/jpeg';
  return { uri: asset.uri, name, type };
}

/**
 * Open the photo library. `limit` above 1 allows multi-select (the Photos step).
 * Returns an empty array when the user cancels or denies access — callers just
 * carry on rather than treating that as an error.
 */
export async function pickImages(limit = 1): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit > 1 ? limit : undefined,
    // Re-encoded below the backend's 5MB cap; it optimises again server-side.
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map(toPicked);
}

/** Single-image convenience — used for the student ID and the counselor headshot. */
export async function pickImage(): Promise<PickedImage | null> {
  const [first] = await pickImages(1);
  return first ?? null;
}
