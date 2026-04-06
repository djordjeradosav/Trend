/**
 * MacroScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Pixel-faithful replica of TrendScannerAI /macro powered by the FRED API.
 *
 * FRED series used:
 *   NFP            PAYEMS       Total Nonfarm Payroll (thousands, level → MoM Δ)
 *   CPI MoM        CPIAUCSL     CPI All Urban Consumers (level → MoM %)
 *   Core CPI MoM   CPILFESL     CPI Less Food & Energy (level → MoM %)
 *   PCE MoM        PCEPI        PCE Price Index (level → MoM %)
 *   Unemployment   UNRATE       Civilian Unemployment Rate (already %)
 *   Interest Rate  FEDFUNDS     Effective Federal Funds Rate (already %)
 *
 * API key is injected as both a query param and Bearer header.
 *
 * Required peer dep:  react-native-svg
 *   npm install react-native-svg
 *   npx pod-install  (iOS)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const FRED_API_KEY = 'dcf37416d4cd3ebdffd61f2e0e269056'; // ← replace with yours
const FRED_BASE = 'https://api.stlouisfed.org/fred';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0a0e1a',
  surface:     '#111827',
  surfaceDeep: '#0d1520',
  border:      '#1e293b',
  borderSoft:  '#131e2d',
  text:        '#f1f5f9',
  muted:       '#64748b',
  dim:         '#334155',
  green:       '#22c55e',
  red:         '#ef4444',
  blue:        '#3b82f6',
  amber:       '#f59e0b',
  purple:      '#8b5cf6',
  cyan:        '#06b6d4',
  orange:      '#f97316',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TimeRange = '6M' | '1Y' | '2Y' | 'ALL';
type TabKey = 'nfp' | 'cpi' | 'core-cpi' | 'pce' | 'unemployment' | 'interest-rate';

interface DataPoint { date: string; value: number; forecast?: number }

interface TabDef {
  key: TabKey;
  label: string;
  dot: string;        // color for the dot next to label
  seriesId: string;
  title: string;
  subtitle: string;
  note: string;
  unit: string;
  isBar: boolean;     // bar chart vs line chart
  invertBeat: boolean; // true = lower is better
  decimals: number;
  color: string;      // chart accent color
  isRate?: boolean;
}

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────
const TABS: TabDef[] = [
  {
    key: 'nfp', label: 'NFP', dot: C.blue,
    seriesId: 'PAYEMS',
    title: 'Non-Farm Payroll — USA',
    subtitle: 'Monthly employment change excluding farm workers · Released first Friday of each month',
    note: "Note: The reported value represents the prior month's employment data. Positive = jobs added. Negative = jobs lost.",
    unit: 'k', isBar: true, invertBeat: false, decimals: 0, color: C.blue,
  },
  {
    key: 'cpi', label: 'CPI', dot: C.amber,
    seriesId: 'CPIAUCSL',
    title: 'CPI — Consumer Price Index MoM',
    subtitle: 'Monthly change in consumer prices · Lower = better (less inflation)',
    note: '',
    unit: '%', isBar: true, invertBeat: true, decimals: 2, color: C.amber,
  },
  {
    key: 'core-cpi', label: 'Core CPI', dot: C.orange,
    seriesId: 'CPILFESL',
    title: 'Core CPI — Excludes Food & Energy MoM',
    subtitle: 'Monthly change in consumer prices · Lower = better (less inflation)',
    note: "Core CPI strips out volatile food and energy prices. This is the Fed's primary inflation gauge for rate decisions.",
    unit: '%', isBar: true, invertBeat: true, decimals: 2, color: C.orange,
  },
  {
    key: 'pce', label: 'PCE', dot: C.purple,
    seriesId: 'PCEPI',
    title: 'PCE — Personal Consumption Expenditures',
    subtitle: "The Federal Reserve's preferred inflation measure",
    note: 'PCE tends to run slightly lower than CPI because it adjusts for changes in consumer behaviour. The Fed uses PCE to guide interest rate decisions and targets 2.0% annual inflation.',
    unit: '%', isBar: false, invertBeat: true, decimals: 2, color: C.purple,
  },
  {
    key: 'unemployment', label: 'Unemployment', dot: C.cyan,
    seriesId: 'UNRATE',
    title: 'Unemployment Rate — USA',
    subtitle: 'Civilian unemployment as % of labour force · Released monthly',
    note: 'Lower than expected = BEAT (strong economy, bullish USD). Higher than expected = MISS (weak economy, bearish USD).',
    unit: '%', isBar: false, invertBeat: true, decimals: 1, color: C.cyan,
  },
  {
    key: 'interest-rate', label: 'Interest Rate', dot: C.blue,
    seriesId: 'FEDFUNDS',
    title: 'Interest Rate — Federal Funds Rate',
    subtitle: 'Benchmark interest rate set by the Federal Reserve · Updated after each FOMC meeting',
    note: '',
    unit: '%', isBar: false, invertBeat: false, decimals: 2, color: C.blue,
    isRate: true,
  },
];

// ─── CHART CONSTANTS ──────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const CW = SW - 32;          // chart width
const CH = 230;               // chart height
const PL = 42, PR = 12, PT = 16, PB = 38; // padding
const PlotW = CW - PL - PR;
const PlotH = CH - PT - PB;

// ─── FRED FETCH ───────────────────────────────────────────────────────────────
async function fredFetch(seriesId: string, limit = 120): Promise<DataPoint[]> {
  const url =
    `${FRED_BASE}/series/observations` +
    `?series_id=${seriesId}&api_key=${FRED_API_KEY}` +
    `&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${FRED_API_KEY}` },
  });
  const json = await res.json();
  const obs: { date: string; value: string }[] = json.observations ?? [];
  return obs
    .filter(o => o.value !== '.' && o.value !== '')
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .reverse();
}

// Level → MoM % change
function toMoMPct(pts: DataPoint[]): DataPoint[] {
  const out: DataPoint[] = [];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1].value;
    if (prev !== 0)
      out.push({ date: pts[i].date, value: +((pts[i].value - prev) / prev * 100).toFixed(4) });
  }
  return out;
}

// Level → MoM absolute change (for PAYEMS)
function toMoMDelta(pts: DataPoint[]): DataPoint[] {
  const out: DataPoint[] = [];
  for (let i = 1; i < pts.length; i++)
    out.push({ date: pts[i].date, value: pts[i].value - pts[i - 1].value });
  return out;
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
function filterRange(data: DataPoint[], r: TimeRange): DataPoint[] {
  if (r === 'ALL') return data;
  const months = r === '6M' ? 6 : r === '1Y' ? 12 : 24;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return data.filter(d => new Date(d.date) >= cutoff);
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const mon = d.toLocaleDateString('en-US', { month: 'short' });
  return `${mon} '${d.getFullYear().toString().slice(2)}`;
}

// ─── AXIS LABEL PICKER ────────────────────────────────────────────────────────
function axisLabels(data: DataPoint[], n = 6): { idx: number; label: string }[] {
  if (data.length === 0) return [];
  const step = Math.max(1, Math.floor(data.length / (n - 1)));
  const idxs = Array.from({ length: n }, (_, i) =>
    Math.min(i * step, data.length - 1));
  // deduplicate
  return [...new Set(idxs)].map(idx => ({ idx, label: fmtShort(data[idx].date) }));
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ data, color, unit, invertBeat }: {
  data: DataPoint[]; color: string; unit: string; invertBeat: boolean;
}) {
  if (data.length === 0) return null;

  const vals = data.map(d => d.value);
  const minV = Math.min(0, ...vals);
  const maxV = Math.max(0, ...vals);
  const range = maxV - minV || 1;

  const toY = (v: number) => PT + PlotH - ((v - minV) / range) * PlotH;
  const zeroY = toY(0);
  const barW = Math.max(3, PlotW / data.length - 2);
  const step = PlotW / data.length;

  const gridCount = 4;
  const gridVals = Array.from({ length: gridCount + 1 }, (_, i) =>
    minV + (range / gridCount) * (gridCount - i));

  const labels = axisLabels(data);

  return (
    <Svg width={CW} height={CH}>
      <Defs>
        <LinearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </LinearGradient>
        <LinearGradient id="gRed" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={C.red} stopOpacity="0.95" />
          <Stop offset="100%" stopColor={C.red} stopOpacity="0.55" />
        </LinearGradient>
      </Defs>

      {/* Grid */}
      {gridVals.map((v, i) => {
        const y = toY(v);
        return (
          <React.Fragment key={i}>
            <Line x1={PL} y1={y} x2={CW - PR} y2={y}
              stroke={C.borderSoft} strokeWidth="1" strokeDasharray="3 3" />
            <SvgText x={PL - 4} y={y + 3.5} fontSize="9" fill={C.muted}
              textAnchor="end" fontFamily="monospace">
              {unit === 'k'
                ? `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`
                : `${v.toFixed(1)}${unit}`}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Zero line */}
      <Line x1={PL} y1={zeroY} x2={CW - PR} y2={zeroY}
        stroke={C.dim} strokeWidth="1.5" />

      {/* Bars */}
      {data.map((d, i) => {
        const x = PL + i * step + (step - barW) / 2;
        const barTop = toY(Math.max(0, d.value));
        const barH = Math.max(2, Math.abs(toY(d.value) - zeroY));
        const beat = invertBeat ? d.value <= 0 : d.value >= 0;
        return (
          <Rect key={i} x={x} y={barTop} width={barW} height={barH}
            fill={beat ? `url(#gBlue)` : `url(#gRed)`} rx={2} />
        );
      })}

      {/* X-axis labels */}
      {labels.map(({ idx, label }) => (
        <SvgText key={idx}
          x={PL + idx * step + step / 2}
          y={CH - 6}
          fontSize="9" fill={C.muted} textAnchor="middle" fontFamily="monospace">
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function LineChart({ data, color, unit, secondary, secColor }: {
  data: DataPoint[]; color: string; unit: string;
  secondary?: DataPoint[]; secColor?: string;
}) {
  if (data.length === 0) return null;

  const allVals = [...data.map(d => d.value), ...(secondary ?? []).map(d => d.value)];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const pad = (maxV - minV) * 0.12 || 0.4;
  const lo = minV - pad, hi = maxV + pad, rng = hi - lo;

  const tx = (i: number, total: number) => PL + (i / Math.max(total - 1, 1)) * PlotW;
  const ty = (v: number) => PT + PlotH - ((v - lo) / rng) * PlotH;

  const pts = (arr: DataPoint[]) =>
    arr.map((d, i) => `${tx(i, arr.length)},${ty(d.value)}`).join(' ');

  const areaPath = (arr: DataPoint[]) => {
    const line = arr.map((d, i) => `${i === 0 ? 'M' : 'L'}${tx(i, arr.length)},${ty(d.value)}`).join(' ');
    return `${line} L${tx(arr.length - 1, arr.length)},${PT + PlotH} L${PL},${PT + PlotH} Z`;
  };

  const gridCount = 4;
  const gridVals = Array.from({ length: gridCount + 1 }, (_, i) =>
    hi - (rng / gridCount) * i);

  const labels = axisLabels(data);
  const gradId = `aG${color.replace('#', '')}`;

  return (
    <Svg width={CW} height={CH}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Grid */}
      {gridVals.map((v, i) => {
        const y = ty(v);
        return (
          <React.Fragment key={i}>
            <Line x1={PL} y1={y} x2={CW - PR} y2={y}
              stroke={C.borderSoft} strokeWidth="1" strokeDasharray="3 3" />
            <SvgText x={PL - 4} y={y + 3.5} fontSize="9" fill={C.muted}
              textAnchor="end" fontFamily="monospace">
              {v.toFixed(1)}{unit}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Area */}
      <Path d={areaPath(data)} fill={`url(#${gradId})`} />

      {/* Secondary line */}
      {secondary && secondary.length > 1 && (
        <Polyline points={pts(secondary)}
          fill="none" stroke={secColor ?? C.cyan}
          strokeWidth="1.5" strokeDasharray="5 4" />
      )}

      {/* Main line */}
      <Polyline points={pts(data)}
        fill="none" stroke={color} strokeWidth="2" />

      {/* Dots */}
      {data.map((d, i) => (
        <Circle key={i} cx={tx(i, data.length)} cy={ty(d.value)} r={2.5} fill={color} />
      ))}

      {/* X-axis labels */}
      {labels.map(({ idx, label }) => (
        <SvgText key={idx}
          x={tx(idx, data.length)}
          y={CH - 6}
          fontSize="9" fill={C.muted} textAnchor="middle" fontFamily="monospace">
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor, badge }: {
  label: string; value: string;
  sub?: string; subColor?: string;
  badge?: { text: string; bg: string; fg: string };
}) {
  return (
    <View style={ss.statCard}>
      <Text style={ss.statLabel}>{label}</Text>
      <Text style={ss.statVal}>{value}</Text>
      {sub ? <Text style={[ss.statSub, subColor ? { color: subColor } : {}]}>{sub}</Text> : null}
      {badge
        ? <View style={[ss.badge, { backgroundColor: badge.bg, borderColor: badge.bg }]}>
            <Text style={[ss.badgeText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        : null}
    </View>
  );
}

function BeatBar({ beats, total, invertBeat }: { beats: number; total: number; invertBeat: boolean }) {
  const pct = total > 0 ? beats / total : 0;
  const verb = invertBeat ? 'lower than expected (beat)' : 'higher than expected (beat)';
  return (
    <View style={ss.beatCard}>
      <Text style={ss.beatLabel}>Came in {verb} {beats}/{total} times ({Math.round(pct * 100)}%)</Text>
      <View style={ss.beatTrack}>
        <View style={[ss.beatFill, { width: `${Math.round(pct * 100)}%` as any }]} />
      </View>
    </View>
  );
}

function RangePicker({ value, onChange }: { value: TimeRange; onChange: (r: TimeRange) => void }) {
  return (
    <View style={ss.rangeRow}>
      {(['6M', '1Y', '2Y', 'ALL'] as TimeRange[]).map(r => (
        <TouchableOpacity key={r}
          style={[ss.rangeBtn, value === r && ss.rangeBtnOn]}
          onPress={() => onChange(r)}>
          <Text style={[ss.rangeTxt, value === r && ss.rangeTxtOn]}>{r}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ChartLegend({ items }: {
  items: { color: string; label: string; shape?: 'bar' | 'line' | 'dot' }[];
}) {
  return (
    <View style={ss.legendRow}>
      {items.map(it => (
        <View key={it.label} style={ss.legendItem}>
          {it.shape === 'bar'
            ? <View style={[ss.legendBar, { backgroundColor: it.color }]} />
            : <View style={[ss.legendLine, { backgroundColor: it.color }]} />}
          <Text style={ss.legendTxt}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return <View style={ss.noteBox}>{children}</View>;
}

function UnemploymentGauge({ value }: { value: number }) {
  const clamp = Math.min(1, Math.max(0, (value - 0) / 8));
  return (
    <View style={ss.gaugeWrap}>
      <View style={ss.gaugeTrack}>
        <View style={[ss.gaugeSegment, { flex: 3.5, backgroundColor: '#166534' }]} />
        <View style={[ss.gaugeSegment, { flex: 1, backgroundColor: '#92400e' }]} />
        <View style={[ss.gaugeSegment, { flex: 3.5, backgroundColor: '#7f1d1d' }]} />
      </View>
      <View style={[ss.gaugeThumb, { left: `${clamp * 100}%` as any }]} />
      <View style={ss.gaugeAnnotations}>
        <Text style={[ss.gaugeAnn, { color: C.green }]}>0%</Text>
        <Text style={[ss.gaugeAnn, { color: C.green, flex: 1, textAlign: 'center' }]}>Full employment ≤3.5%</Text>
        <Text style={[ss.gaugeAnn, { color: C.amber, flex: 1, textAlign: 'center' }]}>Moderate 3.5–4.5%</Text>
        <Text style={[ss.gaugeAnn, { color: C.red, flex: 1, textAlign: 'right' }]}>Elevated &gt;4.5%</Text>
        <Text style={[ss.gaugeAnn, { color: C.red }]}>8%</Text>
      </View>
    </View>
  );
}

function RateHeroCard({ data }: { data: DataPoint[] }) {
  if (!data.length) return null;
  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const change = prev ? latest.value - prev.value : 0;
  const days   = Math.floor((Date.now() - new Date(latest.date + 'T12:00:00').getTime()) / 86400000);
  const totalHike = data.reduce((acc, d, i, arr) => {
    if (i === 0) return acc;
    const delta = d.value - arr[i - 1].value;
    return delta > 0 ? acc + delta : acc;
  }, 0);

  return (
    <View style={ss.rateHero}>
      <View style={{ flex: 1 }}>
        <Text style={ss.rateHeroLbl}>CURRENT FEDERAL FUNDS RATE</Text>
        <Text style={ss.rateHeroVal}>{latest.value.toFixed(2)}%</Text>
        <Text style={ss.rateHeroRange}>
          Target range: {(latest.value - 0.25).toFixed(2)}% – {latest.value.toFixed(2)}%
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={ss.rateHeroMeta}>Last changed: {fmtDate(latest.date)}</Text>
        <Text style={ss.rateHeroMeta}>In effect for: {days} days</Text>
        <View style={ss.holdBadge}>
          <Text style={ss.holdTxt}>— HOLD</Text>
        </View>
      </View>
    </View>
  );
}

function FomcTable({ data }: { data: DataPoint[] }) {
  const rows = [...data].reverse().slice(0, 12);
  return (
    <View style={ss.tableCard}>
      <Text style={ss.tableTitle}>FOMC Rate Decisions</Text>
      <View style={ss.tableHead}>
        {['FOMC DATE','DECISION','RATE BEFORE','RATE AFTER','CHANGE'].map(h => (
          <Text key={h} style={ss.th}>{h}</Text>
        ))}
      </View>
      {rows.map((row, i) => {
        const prevV = data[data.length - 2 - i]?.value ?? row.value;
        const delta = row.value - prevV;
        const isCut = delta < -0.001, isHike = delta > 0.001;
        return (
          <View key={i} style={[ss.tableRow, i % 2 === 1 && ss.tableRowAlt]}>
            <Text style={ss.td}>{fmtDate(row.date)}</Text>
            <View style={ss.td}>
              <View style={[ss.decBadge, {
                backgroundColor: isCut ? '#ef444420' : isHike ? '#22c55e20' : '#94a3b820',
                borderColor:     isCut ? '#ef444450' : isHike ? '#22c55e50' : '#94a3b850',
              }]}>
                <Text style={{ color: isCut ? C.red : isHike ? C.green : C.muted, fontSize: 10, fontWeight: '700' }}>
                  {isCut ? '▼ CUT' : isHike ? '▲ HIKE' : '— HOLD'}
                </Text>
              </View>
            </View>
            <Text style={ss.td}>{prevV.toFixed(2)}%</Text>
            <Text style={[ss.td, { color: isCut ? C.red : isHike ? C.green : C.muted }]}>
              {row.value.toFixed(2)}%
            </Text>
            <Text style={[ss.td, { color: isCut ? C.red : isHike ? C.green : C.dim }]}>
              {delta > 0 ? '+' : ''}{delta.toFixed(2)}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ReleaseTable({ data, unit, decimals, invertBeat, isNFP }: {
  data: DataPoint[]; unit: string; decimals: number; invertBeat: boolean; isNFP?: boolean;
}) {
  const rows = [...data].reverse().slice(0, 12);
  const fmt  = (v: number) => isNFP
    ? `${v >= 0 ? '+' : ''}${v.toFixed(0)}k`
    : `${v.toFixed(decimals)}${unit}`;

  return (
    <View style={ss.tableCard}>
      <Text style={ss.tableTitle}>Release History</Text>
      <View style={ss.tableHead}>
        {['Release Date','Actual','Forecast','Previous','Surprise','Beat/Miss'].map((h, i) => (
          <Text key={h} style={[ss.th, i === 0 && { flex: 1.4 }]}>{h}</Text>
        ))}
      </View>
      {rows.map((row, i) => {
        const prevRow = data[data.length - 2 - i];
        const prevVal = prevRow?.value;
        const surprise = row.forecast !== undefined ? row.value - row.forecast : null;
        const beat = row.forecast !== undefined
          ? (invertBeat ? row.value < row.forecast : row.value > row.forecast)
          : null;
        return (
          <View key={i} style={[ss.tableRow, i % 2 === 1 && ss.tableRowAlt]}>
            <Text style={[ss.td, { flex: 1.4 }]}>{fmtDate(row.date)}</Text>
            <Text style={[ss.td, { color: C.green }]}>{fmt(row.value)}</Text>
            <Text style={[ss.td, { color: C.muted }]}>
              {row.forecast !== undefined ? `${row.forecast.toFixed(decimals)}${unit}` : '—'}
            </Text>
            <Text style={ss.td}>{prevVal !== undefined ? fmt(prevVal) : '—'}</Text>
            <Text style={[ss.td, {
              color: surprise === null ? C.dim : surprise > 0 ? C.green : C.red,
            }]}>
              {surprise !== null ? `${surprise > 0 ? '+' : ''}${surprise.toFixed(decimals)}` : '—'}
            </Text>
            <Text style={[ss.td, {
              color: beat === null ? C.muted : beat ? C.green : C.red,
            }]}>
              {beat === null ? 'PENDING' : beat ? '✓ BEAT' : '✗ MISS'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function MacroScreen() {
  const [activeTab, setActiveTab]   = useState<TabKey>('nfp');
  const [range, setRange]           = useState<TimeRange>('2Y');
  const [rawData, setRawData]       = useState<Record<string, DataPoint[]>>({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tab = TABS.find(t => t.key === activeTab)!;

  // ── Fetch all series ──
  const loadAll = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const results = await Promise.allSettled(TABS.map(t => fredFetch(t.seriesId)));
      const next: Record<string, DataPoint[]> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') next[TABS[i].seriesId] = r.value;
      });
      setRawData(next);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadAll(); setRefreshing(false);
  }, [loadAll]);

  // ── Derive series for current tab ──
  const deriveSeries = (seriesId: string, key: TabKey): DataPoint[] => {
    const raw = rawData[seriesId] ?? [];
    if (!raw.length) return [];
    if (key === 'nfp')           return toMoMDelta(raw);
    if (key === 'interest-rate') return raw;
    if (key === 'unemployment')  return raw;
    return toMoMPct(raw);
  };

  const allSeries   = deriveSeries(tab.seriesId, tab.key);
  const chartSeries = filterRange(allSeries, range);

  const latest = allSeries[allSeries.length - 1];
  const prev   = allSeries[allSeries.length - 2];
  const delta  = latest && prev ? latest.value - prev.value : null;

  const fmtVal = (v: number | undefined) => {
    if (v === undefined) return '—';
    if (tab.key === 'nfp') return `${v >= 0 ? '+' : ''}${v.toFixed(0)}k`;
    return `${v.toFixed(tab.decimals)}${tab.unit}`;
  };

  const latestStr = fmtVal(latest?.value);
  const prevStr   = fmtVal(prev?.value);
  const deltaStr  = delta !== null
    ? `${delta > 0 ? '+' : ''}${delta.toFixed(tab.decimals)}${tab.unit}`
    : '—';

  // Beat count: relative to median
  const sorted = [...allSeries].sort((a, b) => a.value - b.value);
  const median = sorted[Math.floor(sorted.length / 2)]?.value ?? 0;
  const beats  = allSeries.filter(d => tab.invertBeat ? d.value <= median : d.value >= median).length;

  // PCE secondary series (Core PCE = CPILFESL MoM)
  const corePceSeries = tab.key === 'pce'
    ? filterRange(deriveSeries('CPILFESL', 'core-cpi'), range)
    : undefined;

  return (
    <SafeAreaView style={ss.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <View style={ss.header}>
        <View>
          <Text style={ss.headerTitle}>Macro Data</Text>
          <Text style={ss.headerSub}>US economic indicators — live data from FRED</Text>
        </View>
        <TouchableOpacity style={ss.refreshBtn} onPress={loadAll}>
          <Text style={ss.refreshTxt}>↻  Refresh All</Text>
        </TouchableOpacity>
      </View>

      {/* ─── TAB STRIP ──────────────────────────────────────────────────── */}
      <View style={ss.tabStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={ss.tabContent}>
          {TABS.map(t => {
            const on = t.key === activeTab;
            return (
              <TouchableOpacity key={t.key} style={ss.tabItem}
                onPress={() => { setActiveTab(t.key); setRange('2Y'); }}>
                <Text style={[ss.tabTxt, on && { color: C.text }]}>{t.label}</Text>
                <View style={[ss.tabDot, { backgroundColor: t.dot }]} />
                {on && <View style={[ss.tabLine, { backgroundColor: t.dot }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── BODY ───────────────────────────────────────────────────────── */}
      {loading && !refreshing ? (
        <View style={ss.center}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={ss.loadTxt}>Loading FRED data…</Text>
        </View>
      ) : error ? (
        <View style={ss.center}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={[ss.loadTxt, { color: C.text, fontWeight: '700', fontSize: 15 }]}>
            Failed to load
          </Text>
          <Text style={ss.loadTxt}>Check your API key or network.</Text>
          <TouchableOpacity style={ss.retryBtn} onPress={loadAll}>
            <Text style={ss.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={ss.scroll} contentContainerStyle={ss.scrollPad}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={C.green} colors={[C.green]} />}>

          {/* Title */}
          <Text style={ss.pageTitle}>{tab.title}</Text>
          <Text style={ss.pageSub}>{tab.subtitle}</Text>

          {/* Note box */}
          {(tab.key === 'cpi' || tab.key === 'core-cpi') && (
            <NoteBox>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={[ss.noteDot, { backgroundColor: C.red }]} />
                <Text style={ss.noteTxt}>Red bar = higher than expected (miss)</Text>
                <Text style={{ color: C.dim, fontSize: 11 }}> · </Text>
                <View style={[ss.noteDot, { backgroundColor: C.blue }]} />
                <Text style={ss.noteTxt}>Blue bar = lower than expected (beat)</Text>
              </View>
            </NoteBox>
          )}
          {tab.note !== '' && tab.key !== 'cpi' && tab.key !== 'core-cpi' && (
            <NoteBox><Text style={ss.noteTxt}>{tab.note}</Text></NoteBox>
          )}

          {/* Rate hero */}
          {tab.isRate && (
            <RateHeroCard data={rawData[tab.seriesId] ?? []} />
          )}

          {/* Unemployment gauge */}
          {tab.key === 'unemployment' && latest && (
            <UnemploymentGauge value={latest.value} />
          )}

          {/* Stat cards row */}
          <View style={ss.statRow}>
            {tab.isRate ? (
              <>
                <StatCard label="Current Rate"  value={latestStr} />
                <StatCard label="Previous"      value={prevStr} />
                <StatCard label="Last Change"
                  value={delta !== null && Math.abs(delta) > 0.001 ? deltaStr : 'No change'}
                  subColor={delta !== null ? delta > 0 ? C.green : C.red : C.muted} />
                <StatCard label="Cycle total"
                  value={`+${(rawData[tab.seriesId] ?? []).reduce((acc, d, i, arr) => {
                    if (!i) return acc;
                    const dd = d.value - arr[i-1].value;
                    return dd > 0 ? acc + dd : acc;
                  }, 0).toFixed(2)}%`}
                  sub="total hikes this cycle" subColor={C.green} />
              </>
            ) : tab.key === 'pce' ? (
              <>
                <StatCard label="PCE" value={latestStr}
                  sub={latest ? fmtDate(latest.date) : ''} subColor={C.muted} />
                <StatCard label="Fed Target" value="2.0%"
                  sub="Annual inflation target" subColor={C.muted}
                  badge={{ text: 'TARGET', bg: '#166534', fg: C.green }} />
                <StatCard label="Core PCE" value={prevStr} />
                <StatCard label="vs Target"
                  value={latest ? `${(latest.value - 2).toFixed(2)}%` : '—'}
                  sub={latest && latest.value < 2 ? 'Below target' : 'Above target'}
                  subColor={latest && latest.value < 2 ? C.muted : C.red} />
              </>
            ) : tab.key === 'unemployment' ? (
              <>
                <StatCard label="Current Rate" value={latestStr}
                  sub={delta !== null ? delta > 0 ? '✗ Higher than expected' : '✓ Lower than expected' : ''}
                  subColor={delta !== null ? delta > 0 ? C.red : C.green : C.muted}
                  badge={{ text: 'PENDING', bg: C.dim, fg: C.muted }} />
                <StatCard label="Forecast" value="N/A"
                  sub="Analyst consensus" subColor={C.muted} />
                <StatCard label="Previous" value={prevStr} />
                <StatCard label="Change" value={deltaStr}
                  sub={delta !== null ? delta > 0 ? 'Rate rose ↑' : 'Rate fell ↓' : ''}
                  subColor={delta !== null ? delta > 0 ? C.red : C.green : C.muted} />
              </>
            ) : (
              <>
                <StatCard label={tab.key === 'nfp' ? 'Latest Release' : 'Latest'}
                  value={latestStr}
                  sub={latest ? fmtDate(latest.date) : ''} subColor={C.muted} />
                <StatCard label="Forecast" value="N/A"
                  sub="Analyst consensus" subColor={C.muted} />
                <StatCard label="Previous" value={prevStr}
                  sub={prev ? fmtDate(prev.date) : ''} subColor={C.muted} />
                <StatCard label="Surprise" value="—" />
              </>
            )}
          </View>

          {/* Beat bar */}
          <BeatBar beats={beats} total={allSeries.length} invertBeat={tab.invertBeat} />

          {/* Range picker */}
          <RangePicker value={range} onChange={setRange} />

          {/* Chart */}
          <View style={ss.chartCard}>
            {chartSeries.length === 0
              ? <View style={ss.chartEmpty}><Text style={{ color: C.dim }}>No data</Text></View>
              : tab.isBar
                ? <BarChart data={chartSeries} color={tab.color}
                    unit={tab.unit} invertBeat={tab.invertBeat} />
                : <LineChart data={chartSeries} color={tab.color} unit={tab.unit}
                    secondary={corePceSeries}
                    secColor={tab.key === 'pce' ? C.purple : undefined} />
            }
            {/* Legend */}
            {tab.key === 'nfp' && (
              <ChartLegend items={[
                { color: C.blue,  label: 'Actual', shape: 'bar' },
                { color: C.red,   label: 'Forecast' },
                { color: C.green, label: 'Trend' },
              ]} />
            )}
            {tab.key === 'unemployment' && (
              <ChartLegend items={[
                { color: C.cyan,  label: 'Unemployment Rate' },
                { color: C.amber, label: 'Forecast' },
              ]} />
            )}
            {tab.key === 'pce' && (
              <ChartLegend items={[
                { color: C.purple, label: 'PCE' },
                { color: '#7c3aed', label: 'Core PCE' },
                { color: C.amber,  label: 'Forecast' },
              ]} />
            )}
            {(tab.key === 'cpi' || tab.key === 'core-cpi') && (
              <ChartLegend items={[
                { color: C.muted, label: 'Actual', shape: 'bar' },
                { color: C.amber, label: 'Forecast' },
              ]} />
            )}
          </View>

          {/* Tables */}
          {tab.isRate
            ? <FomcTable data={rawData[tab.seriesId] ?? []} />
            : <ReleaseTable data={allSeries} unit={tab.unit}
                decimals={tab.decimals} invertBeat={tab.invertBeat}
                isNFP={tab.key === 'nfp'} />}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  headerSub:   { fontSize: 11, color: C.muted, marginTop: 2 },
  refreshBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  refreshTxt: { fontSize: 12, fontWeight: '600', color: C.muted },

  // Tabs
  tabStrip: { borderBottomWidth: 1, borderBottomColor: C.border },
  tabContent: { paddingHorizontal: 12 },
  tabItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 12, position: 'relative',
  },
  tabTxt:  { fontSize: 13, fontWeight: '600', color: C.muted },
  tabDot:  { width: 6, height: 6, borderRadius: 3 },
  tabLine: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },

  // Scroll
  scroll:    { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 52 },

  // Loading / error
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt:  { fontSize: 13, color: C.muted },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  retryTxt: { fontSize: 13, fontWeight: '700', color: C.green },

  // Page header
  pageTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
  pageSub:   { fontSize: 12, color: C.muted, marginBottom: 12 },

  // Note box
  noteBox: {
    backgroundColor: C.surface, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    padding: 12, marginBottom: 14,
  },
  noteDot: { width: 10, height: 10, borderRadius: 2 },
  noteTxt: { fontSize: 11, color: C.muted, lineHeight: 17 },

  // Stat cards
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    padding: 12, minHeight: 80,
  },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', marginBottom: 6 },
  statVal:   { fontSize: 17, fontWeight: '800', color: C.text },
  statSub:   { fontSize: 10, color: C.muted, marginTop: 3 },
  badge: {
    alignSelf: 'flex-start', marginTop: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4, borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Beat bar
  beatCard: {
    backgroundColor: C.surface, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    padding: 12, marginBottom: 14, gap: 8,
  },
  beatLabel: { fontSize: 12, color: C.muted },
  beatTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  beatFill:  { height: '100%' as any, backgroundColor: C.green, borderRadius: 2 },

  // Range picker
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rangeBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  rangeBtnOn: { backgroundColor: C.green, borderColor: C.green },
  rangeTxt:   { fontSize: 12, fontWeight: '700', color: C.muted },
  rangeTxtOn: { color: '#000' },

  // Chart
  chartCard: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingTop: 4, marginBottom: 16, overflow: 'hidden',
  },
  chartEmpty: { height: CH, alignItems: 'center', justifyContent: 'center' },

  // Legend
  legendRow:  { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendBar:  { width: 14, height: 10, borderRadius: 2 },
  legendLine: { width: 20, height: 2 },
  legendTxt:  { fontSize: 10, color: C.muted },

  // Unemployment gauge
  gaugeWrap: {
    backgroundColor: C.surface, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14,
  },
  gaugeTrack: {
    height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden',
  },
  gaugeSegment: { height: '100%' as any },
  gaugeThumb: {
    position: 'absolute', width: 3, height: 22,
    backgroundColor: C.text, borderRadius: 1.5, top: 6,
  },
  gaugeAnnotations: {
    flexDirection: 'row', marginTop: 8, alignItems: 'center',
  },
  gaugeAnn: { fontSize: 9, fontWeight: '600' },

  // Rate hero
  rateHero: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 14,
  },
  rateHeroLbl: {
    fontSize: 9, fontWeight: '700', color: C.muted,
    letterSpacing: 1.5, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  rateHeroVal:   { fontSize: 36, fontWeight: '900', color: C.text },
  rateHeroRange: { fontSize: 11, color: C.muted, marginTop: 4 },
  rateHeroMeta:  { fontSize: 11, color: C.muted },
  holdBadge: {
    marginTop: 4, backgroundColor: '#94a3b820',
    borderWidth: 1, borderColor: '#94a3b840',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  holdTxt: { fontSize: 11, fontWeight: '700', color: C.muted },

  // Tables
  tableCard: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 16,
  },
  tableTitle: {
    fontSize: 14, fontWeight: '700', color: C.text,
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tableHead: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.surfaceDeep,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  th: {
    flex: 1, fontSize: 9, fontWeight: '700', color: C.muted,
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.borderSoft,
  },
  tableRowAlt: { backgroundColor: C.surfaceDeep },
  td: { flex: 1, fontSize: 11, color: C.text } as any,
  decBadge: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 5, borderWidth: 1, alignSelf: 'flex-start',
  },
});