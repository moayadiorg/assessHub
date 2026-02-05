'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
}

interface SpiderChartProps {
  categoryScores: CategoryScore[]
}

export function SpiderChart({ categoryScores }: SpiderChartProps) {
  const data = categoryScores.map((cs) => ({
    category: cs.categoryName,
    score: cs.score,
    fullMark: 5,
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="var(--gray-6)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fill: 'var(--gray-9)', fontSize: 10 }}
          tickCount={6}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="var(--accent-9)"
          fill="var(--accent-9)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{data.category}</div>
                  <div>Score: {data.score.toFixed(1)} / 5</div>
                </div>
              )
            }
            return null
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
