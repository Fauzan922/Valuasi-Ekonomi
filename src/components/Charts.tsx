import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactRupiah, formatNumber, formatRupiah } from '../lib/valuation/format';

const PALETTE = ['#1b4a37', '#3f6b54', '#6f8f79', '#9aaf9f', '#b9c7b4', '#8a5a1f', '#a98255'];

export interface BarDatum {
  name: string;
  value: number;
}

export function HorizontalBarChart({
  data,
  height = 320,
  ariaLabel,
  formatValue = formatRupiah,
  formatAxis = (value: number) => formatCompactRupiah(value).replace('Rp ', ''),
  valueLabel = 'Nilai',
}: {
  data: BarDatum[];
  height?: number;
  ariaLabel: string;
  formatValue?: (value: number) => string;
  formatAxis?: (value: number) => string;
  valueLabel?: string;
}) {
  const width = 116;
  return (
    <div className="chart" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#e7e4db" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatAxis}
            tick={{ fontSize: 11, fill: '#5f675f' }}
            axisLine={{ stroke: '#d8d5cb' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={width}
            tick={{ fontSize: 12, fill: '#2a302c' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [formatValue(Number(value)), valueLabel]}
            contentStyle={{
              border: '1px solid #d8d5cb',
              borderRadius: 2,
              fontSize: 12,
              boxShadow: 'none',
            }}
          />
          <Bar
            dataKey="value"
            fill="#1b4a37"
            barSize={14}
            radius={[0, 2, 2, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface PieDatum {
  name: string;
  value: number;
}

export function CompositionPieChart({
  data,
  ariaLabel,
  height = 280,
}: {
  data: PieDatum[];
  ariaLabel: string;
  height?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return <p className="muted">Belum ada nilai untuk ditampilkan.</p>;
  }
  return (
    <div className="chart" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={1}
            stroke="#ffffff"
            strokeWidth={1}
            isAnimationActive={false}
          >
            {data.map((item, index) => (
              <Cell key={item.name} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatRupiah(Number(value))}
            contentStyle={{
              border: '1px solid #d8d5cb',
              borderRadius: 2,
              fontSize: 12,
              boxShadow: 'none',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="chart-legend">
        {data.map((item, index) => (
          <li key={item.name}>
            <span
              className="legend-swatch"
              style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              aria-hidden="true"
            />
            <span>{item.name}</span>
            <span className="legend-value">{formatCompactRupiah(item.value)}</span>
            <span className="legend-share">
              {formatNumber((item.value / total) * 100, 1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
