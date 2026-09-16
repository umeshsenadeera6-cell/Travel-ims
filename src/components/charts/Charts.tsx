import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList,
} from 'recharts';
import type { ReactNode } from 'react';
import { CHART_AXIS, CHART_GRID, MAGNITUDE_COLOR, SERIES_COLORS } from '@/utils/constants';

const axisProps = { tick: { fill: CHART_AXIS, fontSize: 12 }, tickLine: false, axisLine: false } as const;

function TooltipBox({ title, rows }: { title?: ReactNode; rows: Array<{ label: string; value: ReactNode; color?: string }> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {title && <p className="mb-1 font-semibold text-slate-800">{title}</p>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 py-0.5">
          {r.color && <span className="size-2.5 rounded-sm" style={{ background: r.color }} />}
          <span className="text-slate-500">{r.label}</span>
          <span className="ml-auto pl-4 font-semibold text-slate-800 tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TP = { active?: boolean; payload?: readonly any[]; label?: string | number };

function LegendRow({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Inbound vs Outbound over time — stacked bars (few buckets) or areas (many). */
export function TrendChart({ data, height = 280, series = ['Inbound', 'Outbound'] }: { data: Array<{ label: string; Inbound: number; Outbound: number }>; height?: number; series?: Array<'Inbound' | 'Outbound'> }) {
  const useBars = data.length <= 12;
  const has = (k: 'Inbound' | 'Outbound') => series.includes(k);
  const top = has('Outbound') ? 'Outbound' : 'Inbound';
  const tooltip = ({ active, payload, label }: TP) =>
    active && payload?.length ? (
      <TooltipBox
        title={label}
        rows={series.map((k) => ({ label: k, value: payload.find((p) => p.dataKey === k)?.value ?? 0, color: SERIES_COLORS[k] }))}
      />
    ) : null;
  return (
    <div>
      {series.length > 1 && <LegendRow items={series.map((k) => ({ label: k, color: SERIES_COLORS[k] }))} />}
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          {useBars ? (
            <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip content={tooltip} cursor={{ fill: '#f1f5f9' }} />
              {has('Inbound') && <Bar isAnimationActive={false} dataKey="Inbound" stackId="a" fill={SERIES_COLORS.Inbound} stroke="#fff" strokeWidth={1} radius={top === 'Inbound' ? [4, 4, 0, 0] : undefined} maxBarSize={36} />}
              {has('Outbound') && <Bar isAnimationActive={false} dataKey="Outbound" stackId="a" fill={SERIES_COLORS.Outbound} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={36} />}
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip content={tooltip} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
              {has('Inbound') && <Area isAnimationActive={false} type="monotone" dataKey="Inbound" stroke={SERIES_COLORS.Inbound} strokeWidth={2} fill={SERIES_COLORS.Inbound} fillOpacity={0.12} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />}
              {has('Outbound') && <Area isAnimationActive={false} type="monotone" dataKey="Outbound" stroke={SERIES_COLORS.Outbound} strokeWidth={2} fill={SERIES_COLORS.Outbound} fillOpacity={0.12} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Two-part donut with centre total and labelled legend. */
export function SplitDonut({ inbound, outbound, height = 220 }: { inbound: number; outbound: number; height?: number }) {
  const total = inbound + outbound;
  const data = [
    { name: 'Inbound', value: inbound, color: SERIES_COLORS.Inbound },
    { name: 'Outbound', value: outbound, color: SERIES_COLORS.Outbound },
  ];
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ height, width: height }}>
        <PieChart width={height} height={height}>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={height * 0.32} outerRadius={height * 0.46} paddingAngle={2} stroke="#fff" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip content={({ active, payload }: TP) => active && payload?.length ? <TooltipBox rows={[{ label: payload[0].name, value: `${payload[0].value} (${total ? Math.round((payload[0].value / total) * 100) : 0}%)`, color: payload[0].payload.color }]} /> : null} />
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900 tabular-nums">{total}</span>
          <span className="text-xs text-slate-500">inquiries</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-3">
            <span className="size-3 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1 text-sm text-slate-600">{d.name}</span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums">{d.value}</span>
            <span className="w-12 text-right text-xs text-slate-500 tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Single-hue horizontal bars for magnitude by category (sources, statuses, destinations). */
export function HBarChart({ data, height, valueLabel = 'Inquiries' }: { data: Array<{ name: string; value: number }>; height?: number; valueLabel?: string }) {
  const h = height ?? Math.max(160, data.length * 36);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap="30%">
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={112} {...axisProps} tick={{ fill: '#334155', fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload }: TP) => active && payload?.length ? <TooltipBox title={payload[0].payload.name} rows={[{ label: valueLabel, value: payload[0].value, color: MAGNITUDE_COLOR }]} /> : null} />
          <Bar isAnimationActive={false} dataKey="value" fill={MAGNITUDE_COLOR} radius={[0, 4, 4, 0]} maxBarSize={18}>
            <LabelList dataKey="value" position="right" style={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped Inbound/Outbound bars per category. */
export function GroupedBarChart({ data, height = 300 }: { data: Array<{ name: string; inbound: number; outbound: number }>; height?: number }) {
  return (
    <div>
      <LegendRow items={[{ label: 'Inbound', color: SERIES_COLORS.Inbound }, { label: 'Outbound', color: SERIES_COLORS.Outbound }]} />
      <div style={{ height }} className="mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="name" {...axisProps} interval={0} tick={{ fill: CHART_AXIS, fontSize: 11 }} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} content={({ active, payload, label }: TP) => active && payload?.length ? <TooltipBox title={label} rows={[{ label: 'Inbound', value: payload[0]?.value ?? 0, color: SERIES_COLORS.Inbound }, { label: 'Outbound', value: payload[1]?.value ?? 0, color: SERIES_COLORS.Outbound }]} /> : null} />
            <Legend content={() => null} />
            <Bar isAnimationActive={false} dataKey="inbound" fill={SERIES_COLORS.Inbound} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar isAnimationActive={false} dataKey="outbound" fill={SERIES_COLORS.Outbound} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Conversion funnel as proportional horizontal steps. */
export function Funnel({ steps }: { steps: Array<{ label: string; value: number; hint?: string }> }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{s.label}</span>
            <span className="text-slate-500">
              <b className="text-base font-semibold text-slate-900 tabular-nums">{s.value}</b>
              {i > 0 && steps[0].value > 0 && <span className="ml-2 text-xs tabular-nums">{Math.round((s.value / steps[0].value) * 100)}% of total</span>}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-brand-500" style={{ width: `${(s.value / max) * 100}%`, opacity: 1 - i * 0.15 }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
