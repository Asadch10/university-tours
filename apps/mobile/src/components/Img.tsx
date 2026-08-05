// Shared image component for the whole app, built on `expo-image`.
//
// Why not react-native's <Image>? expo-image gives us, for free:
//   • a persistent memory + disk cache — a school/guide photo downloads once and
//     is reused instantly on every later mount and across app restarts (RN's Image
//     re-fetches/re-decodes far more eagerly), and
//   • faster native decoding + a smooth fade-in instead of a blank flash.
//
// Defaults here (memory-disk cache + a short crossfade) are what we want almost
// everywhere; callers still override `contentFit`, add a `placeholder`, etc.
import { Image, type ImageProps } from 'expo-image';

export function Img(props: ImageProps) {
  return <Image cachePolicy="memory-disk" transition={180} {...props} />;
}

// Re-export so callers can use `Img.prefetch(url)` to warm the same disk cache
// the component reads from (e.g. Home warming card images behind the skeleton).
Img.prefetch = Image.prefetch;
Img.clearMemoryCache = Image.clearMemoryCache;
