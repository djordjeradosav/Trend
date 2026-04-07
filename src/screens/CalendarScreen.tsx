/**
 * CalendarScreen.tsx
 * — Internal header and BottomTabBar removed (handled by App.tsx)
 * — Theme aligned to the dark TrendScan aesthetic from screenshots
 */

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0d14',   // dark navy — matches Macro screen bg
  bgDeep:    '#060810',
  surface:   '#111827',   // card surfaces
  surfaceHi: '#1a2235',
  border:    '#1e2d45',
  borderDim: '#111c2e',
  text:      '#e2e8f0',
  sub:       '#94a3b8',
  muted:     '#4a6080',
  dim:       '#1e2d45',
  green:     '#22c55e',
  greenDim:  '#166534',
  red:       '#ef4444',
  amber:     '#f59e0b',
  blue:      '#3b82f6',
  purple:    '#a78bfa',
  cyan:      '#38bdf8',
  orange:    '#f97316',
  teal:      '#2dd4bf',
  pink:      '#ec4899',
  yellow:    '#eab308',
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Impact       = 'high' | 'medium' | 'low' | 'holiday';
type ImpactFilter = 'all' | 'high' | 'medium+';

interface CalendarEvent {
  id:        string;
  time:      string;
  timeMs:    number;
  currency:  string;
  impact:    Impact;
  title:     string;
  forecast?: string;
  previous?: string;
  actual?:   string;
  detail?:   string;
  pairs?:    string[];
}

interface DayGroup {
  label:   string;
  date:    string;
  dateObj: Date;
  events:  CalendarEvent[];
}

// ─── CURRENCY META ────────────────────────────────────────────────────────────
const CURRENCY_META: Record<string, { color: string; flag: string }> = {
  USD: { color: '#22c55e', flag: '🇺🇸' },
  EUR: { color: '#3b82f6', flag: '🇪🇺' },
  GBP: { color: '#a78bfa', flag: '🇬🇧' },
  JPY: { color: '#ec4899', flag: '🇯🇵' },
  AUD: { color: '#eab308', flag: '🇦🇺' },
  CAD: { color: '#f97316', flag: '🇨🇦' },
  CHF: { color: '#2dd4bf', flag: '🇨🇭' },
  NZD: { color: '#38bdf8', flag: '🇳🇿' },
  CNY: { color: '#ef4444', flag: '🇨🇳' },
};
const ccColor = (c: string) => CURRENCY_META[c]?.color ?? '#94a3b8';
const ccFlag  = (c: string) => CURRENCY_META[c]?.flag  ?? '🌐';

const IMPACT_COLORS: Record<Impact, string> = {
  high:    '#ef4444',
  medium:  '#f59e0b',
  low:     '#22c55e',
  holiday: '#6366f1',
};

// ─── CALENDAR DATA ────────────────────────────────────────────────────────────
function makeMs(dateStr: string, timeStr: string): number {
  const [h12, period] = timeStr.split(' ');
  const [hStr, mStr]  = h12.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`).getTime();
}

const RAW_DATA: DayGroup[] = [
  {
    label: 'Mon', date: 'Apr 6', dateObj: new Date('2026-04-06'),
    events: [
      { id:'m1', time:'9:00 AM',  timeMs: makeMs('2026-04-06','9:00 AM'),  currency:'EUR', impact:'medium', title:'Spanish Unemployment Change', forecast:'10.3K', previous:'3.6K',  detail:'Change in the number of unemployed people in Spain during the previous month.' },
      { id:'m2', time:'4:00 PM',  timeMs: makeMs('2026-04-06','4:00 PM'),  currency:'USD', impact:'high',   title:'ISM Services PMI',              forecast:'54.8', previous:'56.1',  detail:'Level of a diffusion index based on surveyed purchasing managers in the services industry.' },
      { id:'m3', time:'7:00 PM',  timeMs: makeMs('2026-04-06','7:00 PM'),  currency:'USD', impact:'high',   title:'President Trump Speaks',         detail:'Fed Chair makes a public speech. Traders watch for clues on the future path of monetary policy.' },
    ],
  },
  {
    label: 'Tue', date: 'Apr 7', dateObj: new Date('2026-04-07'),
    events: [
      { id:'t1', time:'1:30 AM',  timeMs: makeMs('2026-04-07','1:30 AM'),  currency:'JPY', impact:'medium', title:'Household Spending y/y',         forecast:'-0.8%', previous:'-1.0%', detail:'Change in the inflation-adjusted value of all expenditures by consumers.' },
      { id:'t2', time:'3:00 AM',  timeMs: makeMs('2026-04-07','3:00 AM'),  currency:'NZD', impact:'low',    title:'ANZ Commodity Prices m/m',        previous:'4.2%',  detail:'Change in the price of exported commodities.' },
      { id:'t3', time:'3:00 AM',  timeMs: makeMs('2026-04-07','3:00 AM'),  currency:'AUD', impact:'low',    title:'MI Inflation Gauge m/m',          previous:'-0.2%', detail:'Early inflation indicator released by Melbourne Institute.' },
      { id:'t4', time:'4:00 AM',  timeMs: makeMs('2026-04-07','4:00 AM'),  currency:'NZD', impact:'high',   title:'RBNZ Rate Statement',             forecast:'3.75%', previous:'3.75%', pairs:['NZDUSD','AUDNZD','NZDJPY'], detail:'The RBNZ rate statement contains the outcome of their decision on interest rates and commentary about economic conditions.' },
      { id:'t5', time:'5:00 AM',  timeMs: makeMs('2026-04-07','5:00 AM'),  currency:'NZD', impact:'high',   title:'RBNZ Press Conference',           detail:'RBNZ Governor holds a press conference following the rate announcement.' },
      { id:'t6', time:'8:30 AM',  timeMs: makeMs('2026-04-07','8:30 AM'),  currency:'USD', impact:'medium', title:'Trade Balance',                   forecast:'-109.0B', previous:'-131.4B', detail:'Difference in value between imported and exported goods and services.' },
      { id:'t7', time:'10:00 AM', timeMs: makeMs('2026-04-07','10:00 AM'), currency:'USD', impact:'medium', title:'JOLTS Job Openings',              forecast:'7.65M', previous:'7.74M', detail:'Number of unfilled job positions.' },
      { id:'t8', time:'1:00 PM',  timeMs: makeMs('2026-04-07','1:00 PM'),  currency:'USD', impact:'low',    title:'3-y Bond Auction',                previous:'4.31|2.5', detail:'The figures display the yield on auctioned bonds and the bid-to-cover ratio.' },
    ],
  },
  {
    label: 'Wed', date: 'Apr 8', dateObj: new Date('2026-04-08'),
    events: [
      { id:'w1', time:'2:00 AM',  timeMs: makeMs('2026-04-08','2:00 AM'),  currency:'JPY', impact:'low',    title:'Average Cash Earnings y/y',      actual:'3.1%', forecast:'3.0%', previous:'2.8%', detail:'Change in the average wages received by employees.' },
      { id:'w2', time:'8:30 AM',  timeMs: makeMs('2026-04-08','8:30 AM'),  currency:'USD', impact:'high',   title:'CPI m/m',                        forecast:'0.3%', previous:'0.4%', detail:'Change in the price of goods and services purchased by consumers.' },
      { id:'w3', time:'8:30 AM',  timeMs: makeMs('2026-04-08','8:30 AM'),  currency:'USD', impact:'high',   title:'Core CPI m/m',                   forecast:'0.3%', previous:'0.4%', detail:'CPI excluding food and energy. Primary Fed gauge for rate decisions.' },
      { id:'w4', time:'10:00 AM', timeMs: makeMs('2026-04-08','10:00 AM'), currency:'USD', impact:'medium', title:'Wholesale Inventories m/m',       forecast:'0.3%', previous:'-0.2%', detail:'Change in the total value of goods held in inventory by wholesalers.' },
      { id:'w5', time:'1:00 PM',  timeMs: makeMs('2026-04-08','1:00 PM'),  currency:'USD', impact:'medium', title:'10-y Bond Auction',              previous:'4.31|2.5', detail:'Yield on auctioned bonds and bid-to-cover ratio.' },
    ],
  },
  {
    label: 'Thu', date: 'Apr 9', dateObj: new Date('2026-04-09'),
    events: [
      { id:'h1', time:'3:30 AM',  timeMs: makeMs('2026-04-09','3:30 AM'),  currency:'EUR', impact:'high',   title:'ECB Main Refinancing Rate',      forecast:'2.65%', previous:'2.65%', detail:'The interest rate on the main refinancing operations.' },
      { id:'h2', time:'3:30 AM',  timeMs: makeMs('2026-04-09','3:30 AM'),  currency:'EUR', impact:'high',   title:'ECB Press Conference',           detail:'ECB President holds a press conference following the rate announcement.' },
      { id:'h3', time:'8:30 AM',  timeMs: makeMs('2026-04-09','8:30 AM'),  currency:'USD', impact:'high',   title:'PPI m/m',                        forecast:'0.2%', previous:'0.0%', detail:'Change in the price of finished goods and services sold by producers.' },
      { id:'h4', time:'8:30 AM',  timeMs: makeMs('2026-04-09','8:30 AM'),  currency:'USD', impact:'medium', title:'Unemployment Claims',            forecast:'223K', previous:'219K', detail:'Number of individuals who filed for unemployment insurance for the first time.' },
      { id:'h5', time:'8:30 AM',  timeMs: makeMs('2026-04-09','8:30 AM'),  currency:'CAD', impact:'medium', title:'Employment Change',              forecast:'25.0K', previous:'1.1K', detail:'Change in the number of employed people during the previous month.' },
      { id:'h6', time:'8:30 AM',  timeMs: makeMs('2026-04-09','8:30 AM'),  currency:'CAD', impact:'medium', title:'Unemployment Rate',              forecast:'6.6%', previous:'6.6%', detail:'Percentage of the total work force that is unemployed.' },
      { id:'h7', time:'2:00 PM',  timeMs: makeMs('2026-04-09','2:00 PM'),  currency:'USD', impact:'high',   title:'FOMC Meeting Minutes',           detail:"Detailed record of the FOMC's most recent meeting, providing in-depth insights into the economic conditions." },
    ],
  },
  {
    label: 'Fri', date: 'Apr 10', dateObj: new Date('2026-04-10'),
    events: [
      { id:'f1', time:'8:30 AM',  timeMs: makeMs('2026-04-10','8:30 AM'),  currency:'USD', impact:'medium', title:'Import Prices m/m',              forecast:'0.1%', previous:'0.4%', detail:'Change in the price of imported goods and services.' },
      { id:'f2', time:'10:00 AM', timeMs: makeMs('2026-04-10','10:00 AM'), currency:'USD', impact:'medium', title:'Prelim UoM Consumer Sentiment',  forecast:'75.0', previous:'74.0', detail:'Level of a composite index based on surveyed consumers.' },
      { id:'f3', time:'1:00 PM',  timeMs: makeMs('2026-04-10','1:00 PM'),  currency:'USD', impact:'low',    title:'Baker Hughes Oil Rig Count',     previous:'489', detail:'Number of active oil drilling rigs in the US.' },
    ],
  },
  {
    label: 'Sat', date: 'Apr 11', dateObj: new Date('2026-04-11'),
    events: [
      { id:'s1', time:'All Day', timeMs: 0, currency:'USD', impact:'holiday', title:'No major events scheduled', detail:'Markets are generally quieter on weekends.' },
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function padTwo(n: number): string { return String(n).padStart(2, '0'); }

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const s  = Math.floor(ms / 1000);
  const d  = Math.floor(s / 86400);
  const h  = Math.floor((s % 86400) / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (d > 0) return `${d}d ${h}h ${padTwo(m)}m`;
  if (h > 0) return `${h}h ${padTwo(m)}m ${padTwo(sc)}s`;
  return `${padTwo(m)}m ${padTwo(sc)}s`;
}

function getActualColor(actual?: string, forecast?: string): string {
  if (!actual || !forecast) return C.text;
  const a = parseFloat(actual.replace(/[^-\d.]/g, ''));
  const f = parseFloat(forecast.replace(/[^-\d.]/g, ''));
  if (isNaN(a) || isNaN(f)) return C.text;
  return a > f ? C.green : a < f ? C.red : C.text;
}

function isToday(d: Date): boolean {
  const n = new Date();
  return (
    d.getDate()     === n.getDate()     &&
    d.getMonth()    === n.getMonth()    &&
    d.getFullYear() === n.getFullYear()
  );
}

// ─── IMPACT BARS ─────────────────────────────────────────────────────────────
function ImpactBars({ impact }: { impact: Impact }) {
  if (impact === 'holiday') {
    return (
      <View style={ib.row}>
        <View style={[ib.bar, ib.barTall, { backgroundColor: IMPACT_COLORS.holiday }]} />
      </View>
    );
  }
  const filled = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
  const color  = IMPACT_COLORS[impact];
  return (
    <View style={ib.row}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={[
            ib.bar,
            i === 0 && ib.barShort,
            i === 1 && ib.barMid,
            i === 2 && ib.barTall,
            { backgroundColor: i < filled ? color : C.dim },
          ]}
        />
      ))}
    </View>
  );
}
const ib = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-end', gap: 2, width: 28 },
  bar:      { width: 7, borderRadius: 2 },
  barShort: { height: 8  },
  barMid:   { height: 13 },
  barTall:  { height: 18 },
});

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  if (!event) return null;
  const ac = getActualColor(event.actual, event.forecast);
  const cc = ccColor(event.currency);
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableOpacity style={dm.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={dm.sheet}>
            <View style={dm.handle} />
            <View style={dm.headerRow}>
              <View style={[dm.ccBadge, { borderColor: cc }]}>
                <Text style={dm.ccFlag}>{ccFlag(event.currency)}</Text>
                <Text style={[dm.ccTxt, { color: cc }]}>{event.currency}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={dm.title}>{event.title}</Text>
                <Text style={dm.time}>{event.time} · {event.impact.toUpperCase()}</Text>
              </View>
              <ImpactBars impact={event.impact} />
            </View>
            {(event.actual || event.forecast || event.previous) && (
              <View style={dm.statsRow}>
                {[
                  { label: 'ACTUAL',   value: event.actual,   color: ac },
                  { label: 'FORECAST', value: event.forecast, color: C.sub },
                  { label: 'PREVIOUS', value: event.previous, color: C.muted },
                ].map(({ label, value, color }) => (
                  <View key={label} style={dm.statBox}>
                    <Text style={dm.statLabel}>{label}</Text>
                    <Text style={[dm.statVal, { color }]}>{value ?? '—'}</Text>
                  </View>
                ))}
              </View>
            )}
            {event.pairs && event.pairs.length > 0 && (
              <View style={dm.pairsRow}>
                {event.pairs.map(p => (
                  <View key={p} style={dm.pairChip}>
                    <Text style={dm.pairTxt}>{p}</Text>
                  </View>
                ))}
              </View>
            )}
            {event.detail && <Text style={dm.detail}>{event.detail}</Text>}
            <TouchableOpacity style={dm.closeBtn} onPress={onClose}>
              <Text style={dm.closeTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
const dm = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(2,6,16,0.93)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: '#0f1624', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28, borderTopWidth: 1, borderColor: C.border },
  handle:    { width: 40, height: 4, backgroundColor: C.dim, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ccBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  ccFlag:    { fontSize: 14 },
  ccTxt:     { fontSize: 11, fontWeight: '800' },
  title:     { fontSize: 16, fontWeight: '700', color: C.text },
  time:      { fontSize: 11, color: C.muted, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statBox:   { flex: 1, backgroundColor: C.surfaceHi, borderRadius: 10, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 9, color: C.muted, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  statVal:   { fontSize: 18, fontWeight: '800' },
  pairsRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pairChip:  { borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  pairTxt:   { fontSize: 11, fontWeight: '700', color: C.muted },
  detail:    { fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 24 },
  closeBtn:  { backgroundColor: C.surfaceHi, borderRadius: 12, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  closeTxt:  { fontSize: 14, fontWeight: '700', color: C.muted },
});

// ─── NEXT HIGH IMPACT CARD ────────────────────────────────────────────────────
function NextHighImpactCard({ events }: { events: CalendarEvent[] }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    return events
      .filter(e => e.impact === 'high' && e.timeMs > now)
      .sort((a, b) => a.timeMs - b.timeMs)[0];
  }, [events, now]);

  if (!next) return null;

  const msLeft    = next.timeMs - now;
  const countdown = formatCountdown(msLeft);
  const parts     = countdown.split(' ');

  const d      = new Date(next.timeMs);
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const label  = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} at ${next.time}`;

  return (
    <View style={ni.card}>
      <View style={ni.topRow}>
        <View style={ni.boltWrap}>
          <Text style={ni.bolt}>⚡</Text>
        </View>
        <Text style={ni.topLabel}>NEXT HIGH IMPACT</Text>
      </View>
      <View style={ni.eventRow}>
        <Text style={[ni.currency, { color: ccColor(next.currency) }]}>{next.currency}</Text>
        <Text style={ni.eventTitle} numberOfLines={1}>{next.title}</Text>
      </View>
      <Text style={ni.dateLabel}>{label}</Text>
      <View style={ni.countdownRow}>
        {parts.map((p, i) => {
          const num  = p.replace(/[dhms]/g, '');
          const unit = p.replace(/\d/g, '');
          return (
            <View key={i} style={ni.countUnit}>
              <Text style={ni.countNum}>{num}</Text>
              <Text style={ni.countUnitLabel}>{unit}</Text>
            </View>
          );
        })}
      </View>
      {next.pairs && (
        <View style={ni.pairsRow}>
          {next.pairs.map(p => (
            <View key={p} style={ni.pairChip}>
              <Text style={ni.pairTxt}>{p}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const ni = StyleSheet.create({
  card:           { marginHorizontal: 12, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  topRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  boltWrap:       { width: 24, height: 24, borderRadius: 6, backgroundColor: C.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  bolt:           { fontSize: 13 },
  topLabel:       { fontSize: 10, fontWeight: '800', color: C.blue, letterSpacing: 1.5 },
  eventRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  currency:       { fontSize: 13, fontWeight: '800' },
  eventTitle:     { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  dateLabel:      { fontSize: 11, color: C.muted, marginBottom: 14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  countdownRow:   { flexDirection: 'row', gap: 4, marginBottom: 14, alignItems: 'baseline' },
  countUnit:      { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  countNum:       { fontSize: 36, fontWeight: '900', color: C.blue, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 42 },
  countUnitLabel: { fontSize: 18, fontWeight: '700', color: C.blue, marginRight: 8 },
  pairsRow:       { flexDirection: 'row', gap: 8 },
  pairChip:       { borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  pairTxt:        { fontSize: 11, fontWeight: '700', color: C.muted },
});

// ─── EVENT ROW ────────────────────────────────────────────────────────────────
function EventRow({ event, onPress }: { event: CalendarEvent; onPress: () => void }) {
  const ac = getActualColor(event.actual, event.forecast);
  const cc = ccColor(event.currency);
  return (
    <TouchableOpacity style={er.row} onPress={onPress} activeOpacity={0.75}>
      <Text style={er.time}>{event.time}</Text>
      <Text style={[er.currency, { color: cc }]}>{event.currency}</Text>
      <ImpactBars impact={event.impact} />
      <Text style={er.title} numberOfLines={1}>{event.title}</Text>
      <View style={er.dataCol}>
        <Text style={er.dataLabel}>F</Text>
        <Text style={er.dataVal}>{event.forecast ?? '—'}</Text>
      </View>
      <View style={er.dataCol}>
        <Text style={er.dataLabel}>P</Text>
        <Text style={er.dataVal}>{event.previous ?? '—'}</Text>
      </View>
      <View style={er.dataCol}>
        <Text style={er.dataLabel}>A</Text>
        <Text style={[er.dataVal, event.actual ? { color: ac } : { color: C.dim }]}>
          {event.actual ?? '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const er = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 8, borderBottomWidth: 1, borderBottomColor: C.borderDim, backgroundColor: C.bg },
  time:      { width: 52, fontSize: 11, color: C.muted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  currency:  { width: 32, fontSize: 11, fontWeight: '800' },
  title:     { flex: 1, fontSize: 13, fontWeight: '500', color: C.sub },
  dataCol:   { alignItems: 'center', gap: 1, minWidth: 30 },
  dataLabel: { fontSize: 9, color: C.dim, fontWeight: '700', letterSpacing: 0.5 },
  dataVal:   { fontSize: 10, color: C.muted },
});

// ─── DAY SECTION HEADER ───────────────────────────────────────────────────────
function DaySectionHeader({ group, isToday: today }: { group: DayGroup; isToday: boolean }) {
  const highCount = group.events.filter(e => e.impact === 'high').length;
  const total     = group.events.length;
  return (
    <View style={[dsh.row, today && dsh.rowToday]}>
      <View style={dsh.left}>
        {today && <View style={dsh.todayBadge}><Text style={dsh.todayTxt}>TODAY</Text></View>}
        <Text style={[dsh.dayLabel, today && { color: C.blue }]}>{group.label}</Text>
        <Text style={dsh.dateLabel}>{group.date}</Text>
      </View>
      <View style={dsh.right}>
        <Text style={dsh.countTxt}>{total} event{total !== 1 ? 's' : ''}</Text>
        {highCount > 0 && (
          <View style={dsh.highPill}>
            <Text style={dsh.highCount}>{highCount} HIGH</Text>
          </View>
        )}
      </View>
    </View>
  );
}
const dsh = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.borderDim, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  rowToday:   { borderLeftColor: C.blue },
  left:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayBadge: { backgroundColor: C.blue, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  todayTxt:   { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  dayLabel:   { fontSize: 15, fontWeight: '800', color: C.text },
  dateLabel:  { fontSize: 13, color: C.muted },
  right:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countTxt:   { fontSize: 11, color: C.muted },
  highPill:   { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  highCount:  { fontSize: 9, fontWeight: '800', color: C.red, letterSpacing: 0.5 },
});

// ─── WEEK HEADER ──────────────────────────────────────────────────────────────
function WeekHeader({ onPrev, onNext, onRefresh }: {
  onPrev: () => void; onNext: () => void; onRefresh: () => void;
}) {
  const allEvents = RAW_DATA.flatMap(d => d.events);
  const high   = allEvents.filter(e => e.impact === 'high').length;
  const medium = allEvents.filter(e => e.impact === 'medium').length;
  const low    = allEvents.filter(e => e.impact === 'low').length;

  return (
    <View style={wh.card}>
      <View style={wh.topRow}>
        <Text style={wh.title}>Economic Calendar</Text>
        <View style={{ flex: 1 }} />
        <View style={wh.summaryRow}>
          <View style={[wh.pill, { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Text style={[wh.pillTxt, { color: C.red }]}>{high}H</Text>
          </View>
          <View style={[wh.pill, { borderColor: 'rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <Text style={[wh.pillTxt, { color: C.amber }]}>{medium}M</Text>
          </View>
          <View style={[wh.pill, { borderColor: C.border, backgroundColor: C.surfaceHi }]}>
            <Text style={[wh.pillTxt, { color: C.muted }]}>{low}L</Text>
          </View>
        </View>
      </View>
      <View style={wh.navRow}>
        <TouchableOpacity style={wh.navBtn} onPress={onPrev}>
          <Text style={wh.navArrow}>‹</Text>
        </TouchableOpacity>
        <View style={wh.weekLabelWrap}>
          <Text style={wh.weekLabel}>Apr 5 – Apr 11, 2026</Text>
        </View>
        <TouchableOpacity style={wh.navBtn} onPress={onNext}>
          <Text style={wh.navArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={wh.refreshBtn} onPress={onRefresh}>
          <Text style={wh.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const wh = StyleSheet.create({
  card:         { marginHorizontal: 12, marginTop: 10, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14 },
  topRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title:        { fontSize: 16, fontWeight: '800', color: C.text },
  summaryRow:   { flexDirection: 'row', gap: 6 },
  pill:         { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  pillTxt:      { fontSize: 11, fontWeight: '700' },
  navRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHi, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  navArrow:     { fontSize: 20, color: C.sub, fontWeight: '700' },
  weekLabelWrap:{ flex: 1, alignItems: 'center', backgroundColor: C.surfaceHi, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingVertical: 7 },
  weekLabel:    { fontSize: 13, fontWeight: '600', color: C.text },
  refreshBtn:   { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceHi, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  refreshIcon:  { fontSize: 16, color: C.sub },
});

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
const CURRENCIES_LIST = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','CNY'];

type ImpactFilterItem = { id: ImpactFilter; label: string; dots?: number; color?: string };
const IMPACT_FILTER_ITEMS: ImpactFilterItem[] = [
  { id: 'all',     label: 'All' },
  { id: 'high',    label: 'High',   dots: 3, color: C.red   },
  { id: 'medium+', label: 'Med+',   dots: 2, color: C.amber },
];

function FilterBar({
  impactFilter, setImpactFilter,
  hideHolidays, setHideHolidays,
  currencyFilter, setCurrencyFilter,
}: {
  impactFilter:      ImpactFilter;
  setImpactFilter:   (f: ImpactFilter) => void;
  hideHolidays:      boolean;
  setHideHolidays:   (v: boolean) => void;
  currencyFilter:    string[];
  setCurrencyFilter: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const toggleCurrency = (c: string) => {
    setCurrencyFilter(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  return (
    <View style={fb.wrap}>
      <View style={fb.impactRow}>
        {IMPACT_FILTER_ITEMS.map(({ id, label, dots = 0, color = 'transparent' }) => {
          const on = impactFilter === id;
          return (
            <TouchableOpacity
              key={id}
              style={[fb.impactBtn, on && fb.impactBtnOn]}
              onPress={() => setImpactFilter(id)}
            >
              {dots > 0 && (
                <View style={fb.miniDots}>
                  {Array.from({ length: dots }).map((_, i) => (
                    <View key={i} style={[fb.miniDot, { backgroundColor: on ? color : C.muted }]} />
                  ))}
                </View>
              )}
              <Text style={[fb.impactTxt, on && { color: C.text }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[fb.holidayBtn, hideHolidays && fb.holidayBtnOn]}
          onPress={() => setHideHolidays(!hideHolidays)}
        >
          <Text style={[fb.holidayCheck, hideHolidays && { color: C.blue }]}>
            {hideHolidays ? '☑' : '☐'}
          </Text>
          <Text style={[fb.holidayTxt, hideHolidays && { color: C.sub }]}>Holidays</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fb.currencyRow}
      >
        {CURRENCIES_LIST.map(c => {
          const on  = currencyFilter.includes(c);
          const col = ccColor(c);
          return (
            <TouchableOpacity
              key={c}
              style={[fb.currBtn, on && { backgroundColor: col + '22', borderColor: col }]}
              onPress={() => toggleCurrency(c)}
            >
              <Text style={fb.currFlag}>{ccFlag(c)}</Text>
              <Text style={[fb.currTxt, { color: on ? col : C.muted }]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
const fb = StyleSheet.create({
  wrap:         { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 10 },
  impactRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },
  impactBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  impactBtnOn:  { backgroundColor: C.surfaceHi, borderColor: C.blue },
  impactTxt:    { fontSize: 11, fontWeight: '600', color: C.muted },
  miniDots:     { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  miniDot:      { width: 4, height: 8, borderRadius: 2 },
  holidayBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  holidayBtnOn: { backgroundColor: C.surfaceHi, borderColor: C.blue },
  holidayCheck: { fontSize: 13, color: C.muted },
  holidayTxt:   { fontSize: 11, fontWeight: '600', color: C.muted },
  currencyRow:  { paddingHorizontal: 12, gap: 6, flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  currBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  currFlag:     { fontSize: 13 },
  currTxt:      { fontSize: 11, fontWeight: '700' },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const [impactFilter,   setImpactFilter]   = useState<ImpactFilter>('all');
  const [hideHolidays,   setHideHolidays]   = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<string[]>([]);
  const [selectedEvent,  setSelectedEvent]  = useState<CalendarEvent | null>(null);

  const allEvents = useMemo(() => RAW_DATA.flatMap(d => d.events), []);

  const filteredGroups = useMemo<DayGroup[]>(() => {
    return RAW_DATA.map(group => ({
      ...group,
      events: group.events.filter(e => {
        if (hideHolidays && e.impact === 'holiday')                             return false;
        if (impactFilter === 'high'    && e.impact !== 'high')                  return false;
        if (impactFilter === 'medium+' && e.impact === 'low')                   return false;
        if (currencyFilter.length > 0 && !currencyFilter.includes(e.currency)) return false;
        return true;
      }),
    })).filter(g => g.events.length > 0);
  }, [impactFilter, hideHolidays, currencyFilter]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollPad}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <WeekHeader
          onPrev={() => {}}
          onNext={() => {}}
          onRefresh={() => {}}
        />

        <FilterBar
          impactFilter={impactFilter}     setImpactFilter={setImpactFilter}
          hideHolidays={hideHolidays}     setHideHolidays={setHideHolidays}
          currencyFilter={currencyFilter} setCurrencyFilter={setCurrencyFilter}
        />

        <NextHighImpactCard events={allEvents} />

        {filteredGroups.map(group => (
          <View key={group.date} style={s.daySection}>
            <DaySectionHeader group={group} isToday={isToday(group.dateObj)} />
            {group.events.map(ev => (
              <EventRow key={ev.id} event={ev} onPress={() => setSelectedEvent(ev)} />
            ))}
          </View>
        ))}

        {filteredGroups.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>📅</Text>
            <Text style={s.emptyTxt}>No events match your filters</Text>
          </View>
        )}
      </ScrollView>

      <DetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: C.bg },
  scroll:    { flex: 1 },
  scrollPad: { paddingBottom: 24 },
  daySection:{ marginBottom: 2 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt:  { fontSize: 14, color: C.muted },
});