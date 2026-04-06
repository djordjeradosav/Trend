
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Modal,
  Platform,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
type Impact = 'high' | 'medium' | 'low' | 'holiday';

interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  impact: Impact;
  title: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  detail?: string;
}

interface DayGroup {
  label: string;
  date: string;
  events: CalendarEvent[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CALENDAR_DATA: DayGroup[] = [
  {
    label: 'Mon',
    date: 'Apr 7',
    events: [
      {
        id: '1',
        time: 'All Day',
        currency: 'EUR',
        impact: 'holiday',
        title: 'German Bank Holiday',
        detail: 'Markets in Germany are closed for the Easter Monday holiday.',
      },
      {
        id: '2',
        time: '8:30am',
        currency: 'USD',
        impact: 'low',
        title: 'Consumer Credit m/m',
        actual: '11.4B',
        forecast: '15.0B',
        previous: '9.7B',
        detail: 'Measures the change in the total value of outstanding consumer credit that requires installment payments.',
      },
      {
        id: '3',
        time: '10:00am',
        currency: 'USD',
        impact: 'medium',
        title: 'ISM Services PMI',
        actual: '53.5',
        forecast: '53.0',
        previous: '52.8',
        detail: 'Level of a diffusion index based on surveyed purchasing managers in the services industry.',
      },
    ],
  },
  {
    label: 'Tue',
    date: 'Apr 8',
    events: [
      {
        id: '4',
        time: '2:00am',
        currency: 'JPY',
        impact: 'low',
        title: 'Average Cash Earnings y/y',
        actual: '3.1%',
        forecast: '3.0%',
        previous: '2.8%',
        detail: 'Change in the average wages and salaries received by employees.',
      },
      {
        id: '5',
        time: '8:30am',
        currency: 'USD',
        impact: 'high',
        title: 'CPI m/m',
        forecast: '0.3%',
        previous: '0.4%',
        detail: 'Change in the price of goods and services purchased by consumers. It\'s the primary gauge of consumer inflation.',
      },
      {
        id: '6',
        time: '8:30am',
        currency: 'USD',
        impact: 'high',
        title: 'Core CPI m/m',
        forecast: '0.3%',
        previous: '0.4%',
        detail: 'Change in the price of goods and services purchased by consumers, excluding food and energy.',
      },
      {
        id: '7',
        time: '10:00am',
        currency: 'USD',
        impact: 'medium',
        title: 'Wholesale Inventories m/m',
        forecast: '0.3%',
        previous: '-0.2%',
        detail: 'Change in the total value of goods held in inventory by wholesalers.',
      },
      {
        id: '8',
        time: '1:00pm',
        currency: 'USD',
        impact: 'medium',
        title: '10-y Bond Auction',
        previous: '4.31|2.5',
        detail: 'The figures display the yield on auctioned bonds and the bid-to-cover ratio.',
      },
    ],
  },
  {
    label: 'Wed',
    date: 'Apr 9',
    events: [
      {
        id: '9',
        time: '8:30am',
        currency: 'USD',
        impact: 'high',
        title: 'PPI m/m',
        forecast: '0.2%',
        previous: '0.0%',
        detail: 'Change in the price of finished goods and services sold by producers.',
      },
      {
        id: '10',
        time: '8:30am',
        currency: 'USD',
        impact: 'medium',
        title: 'Unemployment Claims',
        forecast: '223K',
        previous: '219K',
        detail: 'The number of individuals who filed for unemployment insurance for the first time during the past week.',
      },
      {
        id: '11',
        time: '2:00pm',
        currency: 'USD',
        impact: 'high',
        title: 'FOMC Meeting Minutes',
        detail: 'Detailed record of the FOMC\'s most recent meeting, providing in-depth insights into the economic and financial conditions that influenced their vote.',
      },
    ],
  },
  {
    label: 'Thu',
    date: 'Apr 10',
    events: [
      {
        id: '12',
        time: '3:30am',
        currency: 'EUR',
        impact: 'high',
        title: 'ECB Main Refinancing Rate',
        forecast: '2.65%',
        previous: '2.65%',
        detail: 'The interest rate on the main refinancing operations that provide the bulk of liquidity to the banking system.',
      },
      {
        id: '13',
        time: '3:30am',
        currency: 'EUR',
        impact: 'high',
        title: 'ECB Press Conference',
        detail: 'ECB President holds a press conference following the rate announcement.',
      },
      {
        id: '14',
        time: '8:30am',
        currency: 'CAD',
        impact: 'medium',
        title: 'Employment Change',
        forecast: '25.0K',
        previous: '1.1K',
        detail: 'Change in the number of employed people during the previous month.',
      },
      {
        id: '15',
        time: '8:30am',
        currency: 'CAD',
        impact: 'medium',
        title: 'Unemployment Rate',
        forecast: '6.6%',
        previous: '6.6%',
        detail: 'Percentage of the total work force that is unemployed and actively seeking employment.',
      },
    ],
  },
  {
    label: 'Fri',
    date: 'Apr 11',
    events: [
      {
        id: '16',
        time: '8:30am',
        currency: 'USD',
        impact: 'medium',
        title: 'Import Prices m/m',
        forecast: '0.1%',
        previous: '0.4%',
        detail: 'Change in the price of imported goods and services.',
      },
      {
        id: '17',
        time: '10:00am',
        currency: 'USD',
        impact: 'medium',
        title: 'Prelim UoM Consumer Sentiment',
        forecast: '75.0',
        previous: '74.0',
        detail: 'Level of a composite index based on surveyed consumers.',
      },
      {
        id: '18',
        time: '1:00pm',
        currency: 'USD',
        impact: 'low',
        title: 'Baker Hughes Oil Rig Count',
        previous: '489',
        detail: 'Number of active oil drilling rigs in the US.',
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMPACT_COLORS: Record<Impact, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
  holiday: '#6366f1',
};

const CURRENCY_COLORS: Record<string, string> = {
  USD: '#22c55e',
  EUR: '#3b82f6',
  GBP: '#a855f7',
  JPY: '#ec4899',
  CAD: '#f97316',
  AUD: '#eab308',
  CHF: '#14b8a6',
  NZD: '#06b6d4',
};

const getCurrencyColor = (c: string) => CURRENCY_COLORS[c] ?? '#94a3b8';

const getActualColor = (actual?: string, forecast?: string): string => {
  if (!actual || !forecast) return '#f1f5f9';
  const a = parseFloat(actual.replace(/[^-\d.]/g, ''));
  const f = parseFloat(forecast.replace(/[^-\d.]/g, ''));
  if (isNaN(a) || isNaN(f)) return '#f1f5f9';
  return a > f ? '#22c55e' : a < f ? '#ef4444' : '#f1f5f9';
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ImpactDots: React.FC<{ impact: Impact }> = ({ impact }) => {
  const color = IMPACT_COLORS[impact];
  const filled = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
  if (impact === 'holiday') {
    return (
      <View style={styles.impactRow}>
        <View style={[styles.impactDot, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.impactRow}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={[
            styles.impactDot,
            { backgroundColor: i < filled ? color : '#1e293b' },
          ]}
        />
      ))}
    </View>
  );
};

const EventRow: React.FC<{ event: CalendarEvent; onPress: (e: CalendarEvent) => void }> = ({
  event,
  onPress,
}) => {
  const actualColor = getActualColor(event.actual, event.forecast);
  return (
    <TouchableOpacity
      style={styles.eventRow}
      onPress={() => onPress(event)}
      activeOpacity={0.75}
    >
      <Text style={styles.eventTime}>{event.time}</Text>
      <View style={[styles.currencyBadge, { borderColor: getCurrencyColor(event.currency) }]}>
        <Text style={[styles.currencyText, { color: getCurrencyColor(event.currency) }]}>
          {event.currency}
        </Text>
      </View>
      <ImpactDots impact={event.impact} />
      <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
      <View style={styles.eventNumbers}>
        {event.actual !== undefined ? (
          <Text style={[styles.numActual, { color: actualColor }]}>{event.actual}</Text>
        ) : (
          <Text style={styles.numEmpty}>—</Text>
        )}
        <Text style={styles.numForecast}>{event.forecast ?? '—'}</Text>
        <Text style={styles.numPrevious}>{event.previous ?? '—'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const DetailModal: React.FC<{
  event: CalendarEvent | null;
  onClose: () => void;
}> = ({ event, onClose }) => {
  if (!event) return null;
  const actualColor = getActualColor(event.actual, event.forecast);
  return (
    <Modal transparent animationType="slide" visible={!!event} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.currencyBadgeLg, { borderColor: getCurrencyColor(event.currency) }]}>
              <Text style={[styles.currencyTextLg, { color: getCurrencyColor(event.currency) }]}>
                {event.currency}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>{event.title}</Text>
              <Text style={styles.modalTime}>{event.time}</Text>
            </View>
            <ImpactDots impact={event.impact} />
          </View>
          {/* Stats */}
          {(event.actual || event.forecast || event.previous) && (
            <View style={styles.statsRow}>
              {[
                { label: 'Actual', value: event.actual, color: actualColor },
                { label: 'Forecast', value: event.forecast, color: '#94a3b8' },
                { label: 'Previous', value: event.previous, color: '#64748b' },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statLabel}>{label}</Text>
                  <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Detail */}
          {event.detail && (
            <Text style={styles.modalDetail}>{event.detail}</Text>
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FILTERS: Impact[] = ['high', 'medium', 'low'];
const FILTER_LABELS: Record<string, string> = { high: 'High', medium: 'Med', low: 'Low' };

export default function CalendarScreen() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Impact[]>(['high', 'medium', 'low']);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const toggleFilter = useCallback((f: Impact) => {
    setActiveFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f],
    );
  }, []);

  const dayData = CALENDAR_DATA[selectedDay];
  const filteredEvents = dayData.events.filter(
    e => e.impact === 'holiday' || activeFilters.includes(e.impact),
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenLabel}>ECONOMIC</Text>
          <Text style={styles.screenTitle}>Calendar</Text>
        </View>
        <View style={styles.filterGroup}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                activeFilters.includes(f) && {
                  backgroundColor: IMPACT_COLORS[f] + '22',
                  borderColor: IMPACT_COLORS[f],
                },
              ]}
              onPress={() => toggleFilter(f)}
            >
              <View style={[styles.filterDot, { backgroundColor: IMPACT_COLORS[f] }]} />
              <Text style={[styles.filterLabel, activeFilters.includes(f) && { color: IMPACT_COLORS[f] }]}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Day Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsScroll}
        contentContainerStyle={styles.dayTabsContent}
      >
        {CALENDAR_DATA.map((d, i) => (
          <TouchableOpacity
            key={d.date}
            style={[styles.dayTab, i === selectedDay && styles.dayTabActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayTabLabel, i === selectedDay && styles.dayTabLabelActive]}>
              {d.label}
            </Text>
            <Text style={[styles.dayTabDate, i === selectedDay && styles.dayTabDateActive]}>
              {d.date}
            </Text>
            {i === selectedDay && <View style={styles.dayTabUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Column Headers ── */}
      <View style={styles.colHeader}>
        <Text style={[styles.colText, { width: 54 }]}>Time</Text>
        <Text style={[styles.colText, { width: 40 }]}>Cur</Text>
        <Text style={[styles.colText, { width: 40 }]}>Imp</Text>
        <Text style={[styles.colText, { flex: 1 }]}>Event</Text>
        <Text style={[styles.colText, { width: 40, textAlign: 'right' }]}>Act</Text>
        <Text style={[styles.colText, { width: 40, textAlign: 'right' }]}>Fore</Text>
        <Text style={[styles.colText, { width: 40, textAlign: 'right' }]}>Prev</Text>
      </View>

      {/* ── Events List ── */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
        {filteredEvents.length === 0 ? (
          <Text style={styles.emptyMsg}>No events match the selected filters.</Text>
        ) : (
          filteredEvents.map((ev, idx) => (
            <React.Fragment key={ev.id}>
              {idx > 0 && <View style={styles.divider} />}
              <EventRow event={ev} onPress={setSelectedEvent} />
            </React.Fragment>
          ))
        )}
      </ScrollView>

      <DetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  screenLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // Day Tabs
  dayTabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  dayTabsContent: {
    paddingHorizontal: 12,
    gap: 4,
  },
  dayTab: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    position: 'relative',
  },
  dayTabActive: {},
  dayTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 1,
  },
  dayTabLabelActive: {
    color: '#38bdf8',
  },
  dayTabDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  dayTabDateActive: {
    color: '#f1f5f9',
  },
  dayTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: '#38bdf8',
    borderRadius: 1,
  },

  // Column Headers
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0b1221',
    gap: 4,
  },
  colText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textTransform: 'uppercase',
  },

  // List
  list: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
  },
  emptyMsg: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 14,
  },

  // Event Row
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    gap: 4,
  },
  eventTime: {
    width: 54,
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  currencyBadge: {
    width: 36,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  impactRow: {
    flexDirection: 'row',
    width: 40,
    gap: 3,
    justifyContent: 'center',
  },
  impactDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  eventTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  eventNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  numActual: {
    width: 40,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  numForecast: {
    width: 40,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  numPrevious: {
    width: 40,
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
  numEmpty: {
    width: 40,
    fontSize: 11,
    color: '#334155',
    textAlign: 'right',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencyBadgeLg: {
    width: 48,
    height: 28,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyTextLg: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalDetail: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
  },
});