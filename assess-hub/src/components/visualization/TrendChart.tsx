'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface TrendDataPoint {
  name: string
  date: string
  score: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
  color?: string
}

export function TrendChart({ data, color = 'var(--accent-9)' }: TrendChartProps) {
  const chartData = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    })
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-5)" />
        <XAxis
          dataKey="displayDate"
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
          tickLine={{ stroke: 'var(--gray-6)' }}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
          tickLine={{ stroke: 'var(--gray-6)' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload
              return (
                <div
                  style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {d.name}
                  </div>
                  <div style={{ color: 'var(--gray-11)' }}>
                    Score: {d.score.toFixed(1)} / 5
                  </div>
                  <div style={{ color: 'var(--gray-9)', fontSize: 12 }}>
                    {new Date(d.date).toLocaleDateString()}
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        {/* Reference lines for maturity levels */}
        <ReferenceLine y={2.5} stroke="var(--gray-6)" strokeDasharray="5 5" />
        <ReferenceLine y={3.5} stroke="var(--gray-6)" strokeDasharray="5 5" />
        <Line
          type="monotone"
          dataKey="score"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
