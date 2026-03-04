export const EMOTIONS = [
  { name: 'Joy', color: '#FFD700', icon: '☀️' },
  { name: 'Love', color: '#FF69B4', icon: '💗' },
  { name: 'Calm', color: '#8FBC8F', icon: '🍃' },
  { name: 'Hope', color: '#87CEEB', icon: '🌤️' },
  { name: 'Gratitude', color: '#F59E0B', icon: '🙏' },
  { name: 'Pride', color: '#DAA520', icon: '✨' },
  { name: 'Excitement', color: '#FF6347', icon: '🎉' },
  { name: 'Curiosity', color: '#20B2AA', icon: '🔍' },
  { name: 'Kindness', color: '#FFB6C1', icon: '🌸' },
  { name: 'Sadness', color: '#4169E1', icon: '🌧️' },
  { name: 'Anxiety', color: '#FF8C00', icon: '🌀' },
  { name: 'Fear', color: '#6A0DAD', icon: '🌑' },
  { name: 'Anger', color: '#DC143C', icon: '🔥' },
  { name: 'Loneliness', color: '#6B8E9B', icon: '🌫️' },
]

export function getEmotionColor(emotionName) {
  return EMOTIONS.find(e => e.name === emotionName)?.color || '#888'
}
