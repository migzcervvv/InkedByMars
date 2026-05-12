import { categorizePost } from '../utils/categorizePost'

export const tattooStyles = ['Fine Line', 'Blackwork', 'Neo-traditional', 'Color', 'Minimalist']

const sampleCaptions = [
  'Freehand florals mapped directly to the shoulder.',
  'Custom tattoo concept built from memory and shadow.',
  'Flash design from the red room sheet, claimed fast.',
  'Soft violence in one clean pass.',
  'Free hand script with a little bite.',
  'Customised blackwork keepsake for the part of you that survived.',
  'Flash tattoo linework, small mark with a long echo.',
  'Black ink, warm skin, quiet ritual.',
]

export const mockGallery = Array.from({ length: 24 }, (_, i) => ({
  id: `tattoo-${i + 1}`,
  src: `https://picsum.photos/seed/mars${i + 1}/600/${700 + (i % 3) * 100}`,
  srcSet: `https://picsum.photos/seed/mars${i + 1}/1200/${1400 + (i % 3) * 200} 2x`,
  alt: `Tattoo artwork ${i + 1} by InkedByMars`,
  title: ['Veil Script', 'Ash Bloom', 'Red Fever', 'Night Orchid', 'Saint Static', 'Bone Lace'][i % 6],
  style: tattooStyles[i % tattooStyles.length],
  caption: sampleCaptions[i % sampleCaptions.length],
  category: categorizePost(sampleCaptions[i % sampleCaptions.length]),
  likes: ((i * 137) % 800) + 200,
  date: new Date(2024, Math.floor(i / 2), (i % 28) + 1).toISOString(),
  instagramUrl: 'https://instagram.com/inkedbymars',
  featured: i < 6,
}))
