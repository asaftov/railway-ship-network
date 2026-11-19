// A round monogram for each creator, colored by the wave they publish in.
// Ship Day is violet, wave 2 is cyan and wave 3 is amber. Backups and the comparison group are gray.

const WAVE_COLOR = { 1: "violet", 2: "cyan", 3: "amber" };

export function markColor(c) {
  if (c.group === "paid") return WAVE_COLOR[c.wave] ?? "violet";
  return "gray";
}

// "Chris Raroque" becomes CR, "GreatStack" becomes GS, "Theo (t3.gg)" becomes T.
export function initials(name) {
  const words = name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  const parts = words[0].match(/[A-Z][a-z]+/g);
  if (parts && parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return words[0][0].toUpperCase();
}

export default function CreatorMark({ creator, size = 40 }) {
  const color = markColor(creator);
  const text = initials(creator.name);
  // An image can be set per creator in seed.js (avatar). Without one, the monogram is shown.
  if (creator.avatar) {
    return (
      <img
        className="creator-mark"
        src={creator.avatar}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "cover", boxShadow: `0 0 0 1.5px var(--${color}-7)` }}
      />
    );
  }
  return (
    <span
      className="creator-mark"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * (text.length > 1 ? 0.36 : 0.44)),
        background: `var(--${color}-3)`,
        color: `var(--${color}-11)`,
        boxShadow: `inset 0 0 0 1.5px var(--${color}-7)`,
      }}
    >
      {text}
    </span>
  );
}
