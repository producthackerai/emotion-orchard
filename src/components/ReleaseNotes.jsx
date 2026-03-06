import '../styles/ReleaseNotes.css'

const RELEASES = [
  {
    version: '1.3.0',
    title: 'Magic & True Shuffle',
    date: '2026-03-05',
    items: [
      { text: 'Tap a leaf to see its emotion, gratitude recipient, and note', bold: true },
      { text: 'Desktop: hover to preview, mobile: tap to toggle' },
      { text: 'True shuffle — rearrange now completely randomizes ALL leaf positions' },
      { text: 'Shorter top branches for a denser, fuller canopy shape' },
      { text: 'Fireflies scale with tree growth (3→5→8 as leaves increase)' },
      { text: 'Dappled sunlight spots shimmer through the canopy' },
      { text: 'Gentle falling leaf animation on trees with 15+ leaves' },
      { text: 'Warm ambient glow behind the canopy' },
      { text: 'Grass tufts at the base of the trunk' },
    ],
  },
  {
    version: '1.2.0',
    title: 'Light Mode & Lush Canopy',
    date: '2026-03-04',
    items: [
      { text: 'Light mode is now the default — warm, nature-inspired palette', bold: true },
      { text: 'Dark mode toggle via moon/sun icon in header' },
      { text: '30 base foliage leaves always present — tree looks lush from the start' },
      { text: 'Bigger, more expressive leaf shapes (~35% larger)' },
      { text: 'Base green leaves now participate in the scatter/rearrange animation' },
      { text: '60 total leaves at full growth (30 base + 30 emotion)' },
      { text: 'Theme preference saved across sessions' },
    ],
  },
  {
    version: '1.1.0',
    title: 'Tree of Life Redesign',
    date: '2026-03-04',
    items: [
      { text: 'Hand-crafted Tree of Life branch design — elegant, symmetrical canopy', bold: true },
      { text: 'Rearrange button — scatter animation sends leaves flying, then they land in new spots' },
      { text: 'Non-overlapping leaf positions using golden angle distribution' },
      { text: 'Fixed CSS/SVG transform conflict that caused leaves to cluster at origin' },
      { text: 'Canopy glow effect that intensifies as leaves grow' },
      { text: 'Fireflies appear after 8+ leaves' },
    ],
  },
  {
    version: '1.0.0',
    title: 'Welcome to Emotion Orchard',
    date: '2026-03-03',
    items: [
      { text: 'Plant Emotion Trees and tap feelings to grow leaves', bold: true },
      { text: 'Create Gratitude Trees to honor the people you appreciate' },
      { text: 'Beautiful SVG trees with organic, procedural generation' },
      { text: 'Orchard view to see all your trees at a glance' },
      { text: 'Emotional insights with distribution charts and balance meter' },
      { text: 'AI companion for reflection and emotional awareness' },
      { text: 'Share public trees with friends via link' },
      { text: 'Mobile-first design with smooth animations' },
    ],
  },
]

export default function ReleaseNotes() {
  return (
    <div className="release-notes">
      <h2 className="release-notes-title">Release Notes</h2>

      {RELEASES.map((release) => (
        <div key={release.version} className="release-card">
          <div className="release-header">
            <span className="release-version">v{release.version}</span>
            <span className="release-date">{release.date}</span>
          </div>
          <h3 className="release-name">{release.title}</h3>
          <ul className="release-items">
            {release.items.map((item, i) => (
              <li key={i} className={item.bold ? 'release-item-bold' : ''}>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
