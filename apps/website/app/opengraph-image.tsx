import { ImageResponse } from 'next/og';

/* Every share of the site used to preview as a bare link — no og:image was set
   at all. Generated rather than a checked-in PNG so the wordmark stays in sync
   with the brand colour and nobody has to re-export a file to edit the copy. */

export const alt = 'University Campus Private Tours — private tours led by real students';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MAROON = '#5F0102';
const IVORY = '#FDFBF7';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '84px 96px',
          background: `linear-gradient(135deg, ${MAROON} 0%, #3d0a12 100%)`,
          color: IVORY,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: 0.72,
            marginBottom: 34,
          }}
        >
          University Campus Private Tours
        </div>
        <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
          Book private campus tours.
        </div>
        <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, opacity: 0.62 }}>
          Things just got personal.
        </div>
        <div style={{ fontSize: 32, marginTop: 40, opacity: 0.82, lineHeight: 1.4 }}>
          Private tours and video consultations with verified current students.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 46,
            fontSize: 28,
            opacity: 0.7,
          }}
        >
          university.tours
        </div>
      </div>
    ),
    size,
  );
}
