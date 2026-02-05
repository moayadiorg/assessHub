'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface CategoryScore {
  categoryId: string
  categoryName: string
  score: number
}

interface ComparisonSpiderChartProps {
  data1: CategoryScore[]
  data2: CategoryScore[]
  label1: string
  label2: string
}

export function ComparisonSpiderChart({
  data1,
  data2,
  label1,
  label2
}: ComparisonSpiderChartProps) {
  // Merge data for the chart
  const chartData = data1.map((cat1, index) => ({
    category: cat1.categoryName,
    score1: cat1.score,
    score2: data2[index]?.score || 0,
    fullMark: 5
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
        <PolarGrid stroke="var(--gray-6)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'var(--gray-11)', fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fill: 'var(--gray-9)', fontSize: 10 }}
          tickCount={6}
        />

        {/* Assessment 1 - Blue */}
        <Radar
          name={label1}
          dataKey="score1"
          stroke="var(--blue-9)"
          fill="var(--blue-9)"
          fillOpacity={0.2}
          strokeWidth={2}
        />

        {/* Assessment 2 - Green */}
        <Radar
          name={label2}
          dataKey="score2"
          stroke="var(--green-9)"
          fill="var(--green-9)"
          fillOpacity={0.2}
          strokeWidth={2}
        />

        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span style={{ color: 'var(--gray-12)', fontSize: 12 }}>{value}</span>
          )}
        />

        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    {label}
                  </div>
                  {payload.map((entry: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        color: entry.color,
                        marginBottom: 4
                      }}
                    >
                      {entry.name}: {entry.value.toFixed(1)} / 5
                    </div>
                  ))}
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
