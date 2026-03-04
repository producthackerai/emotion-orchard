import { useMemo } from 'react'
import { BarChart3, TrendingUp, Heart, Sparkles } from 'lucide-react'
import { EMOTIONS, getEmotionColor } from '../data/emotions'
import '../styles/AnalysisView.css'

export default function AnalysisView({ trees, allLeaves }) {
  const analysis = useMemo(() => {
    const emotionLeaves = allLeaves.filter(l => l.emotion)
    const gratitudeLeaves = allLeaves.filter(l => l.person_name)

    // Emotion distribution
    const emotionCounts = {}
    for (const leaf of emotionLeaves) {
      emotionCounts[leaf.emotion] = (emotionCounts[leaf.emotion] || 0) + 1
    }
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])
    const maxCount = sorted[0]?.[1] || 1

    // Gratitude people
    const peopleCounts = {}
    for (const leaf of gratitudeLeaves) {
      peopleCounts[leaf.person_name] = (peopleCounts[leaf.person_name] || 0) + 1
    }
    const topPeople = Object.entries(peopleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Recent trend (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentEmotions = emotionLeaves.filter(l => new Date(l.created_at) > weekAgo)
    const recentCounts = {}
    for (const leaf of recentEmotions) {
      recentCounts[leaf.emotion] = (recentCounts[leaf.emotion] || 0) + 1
    }

    // Positive vs negative balance
    const positiveEmotions = ['Joy', 'Love', 'Calm', 'Hope', 'Gratitude', 'Pride', 'Excitement', 'Curiosity', 'Kindness']
    const positiveCount = emotionLeaves.filter(l => positiveEmotions.includes(l.emotion)).length
    const balance = emotionLeaves.length > 0 ? Math.round((positiveCount / emotionLeaves.length) * 100) : 0

    return {
      totalLeaves: allLeaves.length,
      emotionLeaves: emotionLeaves.length,
      gratitudeLeaves: gratitudeLeaves.length,
      distribution: sorted,
      maxCount,
      topPeople,
      uniqueEmotions: sorted.length,
      balance,
      recentCounts,
      mostFrequent: sorted[0]?.[0],
    }
  }, [allLeaves])

  if (allLeaves.length === 0) {
    return (
      <div className="analysis-view">
        <div className="analysis-empty">
          <Sparkles size={32} className="analysis-empty-icon" />
          <p className="analysis-empty-title">Not enough data yet</p>
          <p className="analysis-empty-text">
            Add some leaves to your trees, and patterns will emerge here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="analysis-view">
      <h2 className="analysis-title">Emotional Insights</h2>

      {/* Stats row */}
      <div className="analysis-stats">
        <div className="stat-card">
          <span className="stat-value">{analysis.totalLeaves}</span>
          <span className="stat-label">Total Leaves</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{analysis.uniqueEmotions}</span>
          <span className="stat-label">Emotions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{trees.length}</span>
          <span className="stat-label">Trees</span>
        </div>
      </div>

      {/* Balance meter */}
      {analysis.emotionLeaves > 3 && (
        <div className="analysis-card">
          <p className="card-label">
            <TrendingUp size={10} />
            Emotional Balance
          </p>
          <div className="balance-bar">
            <div
              className="balance-fill"
              style={{ width: `${analysis.balance}%` }}
            />
          </div>
          <div className="balance-labels">
            <span>Challenging</span>
            <span>{analysis.balance}% uplifting</span>
            <span>Uplifting</span>
          </div>
          <p className="balance-insight">
            {analysis.balance > 70
              ? "Your orchard is blooming with positive energy. Beautiful growth."
              : analysis.balance > 40
              ? "A healthy mix of emotions. Every feeling adds richness to your garden."
              : "You're working through some challenging feelings. That takes real courage."}
          </p>
        </div>
      )}

      {/* Emotion distribution */}
      {analysis.distribution.length > 0 && (
        <div className="analysis-card">
          <p className="card-label">
            <BarChart3 size={10} />
            Emotion Distribution
          </p>
          <div className="distribution-chart">
            {analysis.distribution.map(([emotion, count]) => (
              <div key={emotion} className="dist-row">
                <div className="dist-label">
                  <span
                    className="dist-dot"
                    style={{ backgroundColor: getEmotionColor(emotion) }}
                  />
                  <span className="dist-name">{emotion}</span>
                </div>
                <div className="dist-bar-bg">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${(count / analysis.maxCount) * 100}%`,
                      backgroundColor: getEmotionColor(emotion),
                    }}
                  />
                </div>
                <span className="dist-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top gratitude people */}
      {analysis.topPeople.length > 0 && (
        <div className="analysis-card">
          <p className="card-label">
            <Heart size={10} />
            Most Appreciated
          </p>
          <div className="people-list">
            {analysis.topPeople.map(([name, count]) => (
              <div key={name} className="person-row">
                <span className="person-name">{name}</span>
                <span className="person-count">{count} blossom{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
