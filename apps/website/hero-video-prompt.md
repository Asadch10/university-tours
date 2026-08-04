# Hero Video — AI Generation Brief

New homepage hero video covering the three tour types in one continuous loop:

1. **Campus Tour** — in-person, student-led
2. **Virtual One-to-One Chat** — live video call with a current student
3. **Pro Admission Counselor** — professional admissions guidance

Replaces the current hero sources referenced in `components/home/hero.tsx` (lines 288 and 292).

---

## 1. Output specifications

| Spec | Value | Reason |
| ---- | ----- | ------ |
| Resolution | **1920 × 1080** | Matches the current hero; a background loop gains nothing from 4K |
| Aspect ratio | **16:9** | Container uses `aspect-video` |
| Frame rate | **30 fps** | Matches the current hero |
| Duration | **27–30 s** (3 parts × 9–10 s) | Current video is 72 s / 18.5 MB — too heavy for LCP |
| Audio | **None — strip it** | The `<video>` is `muted` and `aria-hidden` |
| Codecs | AV1 (primary) + H.264 (fallback) | Mirrors the two existing `<source>` tags |
| Target file size | ≤ 6 MB AV1, ≤ 9 MB H.264 | Roughly one third of today's payload |
| Color space | Rec.709, `yuv420p` | Universal browser support |

## 2. Composition safe zones

These come directly from how the hero renders, and they are not optional.

- **Left 0–45% of frame** — covered by a dark gradient (`rgba(10,8,6,0.72)` → `0.44`) and, at `lg+`, by the booking card. Keep this area soft and empty: sky, lawn, defocused architecture. No faces, no action.
- **Right 50–90% of frame** — the hero zone. All subjects, faces, and motion belong here.
- **Top and bottom 12%** — cropped. `sm:max-h-[calc(100dvh-var(--header-h))]` clamps the container height on short viewports, and `object-cover` trims vertically. Keep faces and the horizon vertically centered.
- **Extreme right edge (90–100%)** — avoid critical subjects; safe on desktop but tight on narrow screens.

## 3. Brand look

Pulled from `design.md` so the footage grades into the site rather than fighting it.

- Deep collegiate maroon `#6b1521`, brand core maroon `#7a1a32`
- Warm gold accent `#cf9526`
- Ivory `#fbf8f3` and cream `#f6f0e7` canvas tones
- Warm neutral ink `#1f1a16` for shadow depth
- Overall: warm, premium, slightly desaturated highlights, gentle film grain

---

## 4. Master style prompt

Paste this block at the **top of every one of the three shot prompts**.

```
Photorealistic cinematic documentary footage.
Shot on ARRI Alexa with a 35mm anamorphic lens, shallow depth of field at T2.0.
Natural golden-hour sunlight with soft warm bounce fill.
Warm collegiate color grade: deep maroon #6b1521 and warm gold #cf9526 accents against ivory and cream tones.
Rich contrast with slightly desaturated highlights and gentle 35mm film grain.
Real people with authentic candid behavior and natural imperfect movement.
No stock-footage posing, no direct-to-camera smiling, no exaggerated gestures.
Slow, steady, deliberate camera motion — subtle dolly or gentle handheld float, under 10% of frame width.
Subjects composed in the right half of the frame; the left third stays open, soft and out of focus.
Faces and horizon kept vertically centered, away from the top and bottom edges.
No text, no captions, no subtitles, no logos, no watermarks, no on-screen graphics, no UI overlays.
```

---

## 5. Part 1 — Campus Tour (0:00–0:09)

```
Golden-hour tracking shot on a historic university quad.
A current college student walks backward down a stone path, gesturing warmly as they lead a private campus tour.
They are guiding a family of three: a 17-year-old prospective student and two parents.
The guide wears a simple maroon university sweatshirt, hair moving slightly in the breeze.
Ivy-covered brick buildings and a stone clock tower sit softly blurred in the left background.
Autumn leaves drift across the path; other students cross far in the distance.
The family walks toward camera, listening and looking up at the architecture.
The teenager laughs at something the guide says; one parent points toward a building off-frame.
Camera dollies backward at natural walking pace with a slight handheld drift.
The guide and family occupy the right two thirds of the frame throughout.
Warm sun flare filters through tree branches along the right edge.
Depth of field is shallow, the background compresses gently, the light is late-afternoon amber.
No dialogue is legible, no text appears anywhere in frame.
```

**Direction notes**

- The guide's back should never fully block the family's faces.
- Keep the walk speed slow enough that limbs stay coherent — fast gaits are where AI video breaks.
- End the shot with the group still mid-stride so the cut carries momentum.

---

## 6. Part 2 — Virtual One-to-One Chat (0:09–0:18)

```
Intimate interior shot of a real college dorm room at soft evening lamplight.
String lights, stacked textbooks, a corkboard of photos, and a laptop propped on a wooden desk.
A current student sits at the desk mid-conversation on a live one-to-one video call.
They are animated and gesturing, explaining something with genuine enthusiasm, leaning in slightly.
The laptop screen casts a soft cool glow across the side of their face.
The screen shows an abstract, heavily blurred video-call interface with a single silhouetted person in a call tile.
No legible text, no readable interface elements, no recognizable app design on the screen.
Camera begins over the student's shoulder and pushes in slowly toward the screen.
Midway through, focus racks softly from the screen back to the student's face.
The student sits right of center; a dorm window with dusk-blue light fills the soft-focus left third.
Warm practical lighting from a desk lamp mixes with the cool screen glow.
Shallow depth of field, photorealistic skin texture, natural hair detail, gentle film grain.
```

**Direction notes**

- Warm lamp on the face, cool screen light as rim — this contrast is what sells the shot.
- Keep the laptop screen deliberately abstract; any attempt at a real UI will render as garbled text.
- Hands should stay mostly below frame or in slow motion; static or slow hands avoid finger artifacts.

---

## 7. Part 3 — Pro Admission Counselor (0:18–0:27)

```
Refined professional interior: a warm oak-paneled office or upscale study.
Floor-to-ceiling bookshelves, a brass desk lamp, and a large window with soft diffused daylight.
A composed, experienced admissions counselor in their forties sits across a polished wooden table.
Opposite them sit a high-school student and one parent, both attentive and engaged.
The counselor gestures thoughtfully over an open folder of documents and a printed application timeline.
The counselor listens first, then leans in to explain a point; the parent nods; the student takes notes in a notebook.
Loose papers, a fountain pen, and a coffee cup on the table catch the window light.
Camera performs a slow lateral dolly to the right, gradually revealing the full group.
The shot settles with the counselor and student sharply rendered in the right half of the frame.
The bookshelf and window remain softly defocused across the left third.
Lighting is authoritative but warm, with amber wood tones and clean diffused daylight.
No readable text on any document, no legible writing in the notebook, no signage on the walls.
```

**Direction notes**

- Read as premium and calm, never salesy — this is the highest-trust part of the sequence.
- Documents stay defocused or angled away from camera so text illegibility looks intentional.
- Finish on the counselor's face, since it is the last thing the viewer sees before the loop restarts.

---

## 8. Achieving realism — use image-to-video, not text-to-video

This is the single largest quality lever.

1. Source three real photographs — a genuine student-led campus tour, a real dorm-desk video call, and a real counseling session. Licensed stock (Getty, Stocksy, Unsplash+) works; **your own photos from real guides work far better**.
2. Load each photo as the **first-frame reference image** in the generator.
3. Use the prompt above as the **motion instruction only** — the photo already carries the realism, the lighting, the faces, and the brand look.
4. Generate **3–4 variants per part** and keep the best. AI video has a high reject rate.

**Suitable tools:** Sora 2, Google Veo 3.1, Runway Gen-4, Kling 2.5. All support first-frame image conditioning at 1080p.

**Known failure modes to check on every take:** hands and fingers, walking gaits, background faces melting, text on any surface, and objects passing behind subjects.

---

## 9. Assembly

- Add all title cards in post — Premiere, DaVinci Resolve, or CapCut. **Never ask the AI to render text**; it produces garbled letterforms.
- Typography: Playfair Display for headings, Inter for body, per `design.md`.
- Place all text in the right half of the frame so it does not collide with the booking card.
- Transition between parts with a 12-frame cross-dissolve.
- Match the last frame of Part 3 to the first frame of Part 1 in exposure and composition so the `loop` restart is invisible.
- Export the master as ProRes 422 or high-bitrate H.264 before the final encode below.

## 10. Encode

```bash
# H.264 fallback — broadest compatibility
ffmpeg -i master.mov -an -c:v libx264 -profile:v high -crf 24 -preset slow \
  -vf "scale=1920:1080:flags=lanczos,fps=30" -pix_fmt yuv420p \
  -movflags +faststart homepage-hero-v2-1080p.mp4

# AV1 primary — roughly 40% smaller at equivalent quality
ffmpeg -i master.mov -an -c:v libsvtav1 -crf 34 -preset 4 \
  -vf "scale=1920:1080:flags=lanczos,fps=30" -pix_fmt yuv420p \
  -movflags +faststart homepage-hero-v2-1080p-av1.mp4

# Poster frame — grab a strong frame from Part 1
ffmpeg -i master.mov -ss 00:00:03 -frames:v 1 -q:v 2 homepage-hero-v2-poster.jpg
```

`-an` strips the audio track, saving roughly 1 MB on a track no one can hear.

## 11. Deployment

Upload all three files to `d3m810mf773mim.cloudfront.net/static/hero/`, then update
`components/home/hero.tsx`:

- Line 288 — AV1 `src`
- Line 292 — H.264 `src`
- Add a `poster="…/homepage-hero-v2-poster.jpg"` attribute to the `<video>` tag (line 277). There is
  no poster today, so a blank frame shows before playback begins.

Verify with `pnpm typecheck`, then confirm the loop point and the card overlay at 375px, 768px,
1024px, and 1440px widths.
