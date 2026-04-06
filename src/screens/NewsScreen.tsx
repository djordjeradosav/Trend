/**
 * NewsScreen.tsx  — responsive, mobile-first rewrite
 * ─────────────────────────────────────────────────────────────────────────────
 * Data: NewsAPI.org  (key from .env.local → NEWS_API_KEY)
 *
 * Layout behaviour:
 *   < 480 px  → 1-column feed (phone portrait)
 *   480–767   → 2-column grid (phone landscape / small tablet)
 *   768 +     → 3-column grid (tablet / desktop)
 *
 * Touch targets: all interactive elements ≥ 44 pt (Apple HIG)
 * Pull-to-refresh, skeleton loading, auto-refresh every 15 min.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

// ─── ENV ─────────────────────────────────────────────────────────────────────
const NEWS_API_KEY =
  (typeof process !== 'undefined' && process.env?.NEWS_API_KEY) ||
  '912f34b2ecb148a28ca31a4adc4ecc1f';
const NEWS_BASE = 'https://newsapi.org/v2';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:         '#080d18',
  surface:    '#0e1420',
  surfaceHi:  '#131c2e',
  border:     '#1c2a40',
  borderDim:  '#111929',
  text:       '#f0f4fa',
  sub:        '#cbd5e1',
  muted:      '#5a7090',
  dim:        '#2a3a52',
  green:      '#22c55e',
  red:        '#ef4444',
  blue:       '#3b82f6',
  amber:      '#f59e0b',
  purple:     '#a78bfa',
  cyan:       '#38bdf8',
  orange:     '#f97316',
  teal:       '#2dd4bf',
};

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────────────────
function useCols(): number {
  const { width } = useWindowDimensions();
  if (width >= 768) return 3;
  if (width >= 480) return 2;
  return 1;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SentimentFilter = 'All' | 'Positive' | 'Neutral' | 'Negative';
type CategoryFilter  = 'All' | 'Forex' | 'Commodities' | 'Futures' | 'Crypto';
type Sentiment       = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

interface Article {
  id:          string;
  source:      string;
  title:       string;
  description: string;
  url:         string;
  publishedAt: string;
  ago:         string;
  sentiment:   Sentiment;
  category:    Exclude<CategoryFilter, 'All'>;
  tickers:     string[];
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function detectSentiment(title: string, desc: string): Sentiment {
  const text = (title + ' ' + desc).toLowerCase();
  const ps   = (text.match(/beat|surge|rally|gain|rise|jump|strong|bullish|high|record|growth|profit|outperform|boost|recover|positive|exceed/g) || []).length;
  const ns   = (text.match(/fall|drop|decline|miss|weak|bearish|crash|loss|recession|risk|concern|warn|plunge|underperform|negative/g) || []).length;
  if (ps > ns + 1) return 'POSITIVE';
  if (ns > ps + 1) return 'NEGATIVE';
  return 'NEUTRAL';
}

function detectCategory(title: string, desc: string): Exclude<CategoryFilter, 'All'> {
  const t = (title + ' ' + desc).toLowerCase();
  if (/bitcoin|crypto|btc|eth|ethereum|blockchain|defi|nft|altcoin/.test(t)) return 'Crypto';
  if (/futures|contract|cme|expiry|rollover|derivative/.test(t))              return 'Futures';
  if (/oil|gold|silver|copper|wheat|corn|commodity|crude|wti|brent/.test(t)) return 'Commodities';
  return 'Forex';
}

function detectTickers(title: string, desc: string): string[] {
  const text   = title + ' ' + desc;
  const pairs  = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY'];
  const ccys   = ['USD','EUR','GBP','JPY','CAD','AUD','CHF','NZD','CNY'];
  const crypto = ['BTC','ETH','XRP','SOL','BNB','DOGE'];
  const idx    = ['S&P500','DOW','NASDAQ','US30','US500','GER40'];
  const found  = new Set<string>();
  pairs.forEach(p  => { if (text.includes(p))                      found.add(p); });
  if (!found.size) {
    ccys.forEach(c   => { if (new RegExp(`\\b${c}\\b`).test(text)) found.add(c); });
    crypto.forEach(c => { if (new RegExp(`\\b${c}\\b`).test(text)) found.add(c); });
    idx.forEach(s    => { if (text.includes(s))                    found.add(s); });
  }
  return [...found].slice(0, 3);
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 24) return r ? `${h}h ${r}m ago` : `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtSource(raw: string): string {
  return raw.toUpperCase().replace(/\.COM$/, '').replace(/[-_]/g, ' ').slice(0, 18);
}

// ─── NEWSAPI ──────────────────────────────────────────────────────────────────
async function fetchNews(): Promise<Article[]> {
  const q = 'forex OR bitcoin OR "interest rate" OR "stock market" OR commodities OR gold OR oil';
  const url = `${NEWS_BASE}/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=60&apiKey=${NEWS_API_KEY}`;
  const res  = await fetch(url);
  const json = await res.json();
  if (json.status !== 'ok') throw new Error(json.message ?? 'NewsAPI error');
  return (json.articles ?? [])
    .filter((a: any) => a.title && a.title !== '[Removed]' && a.source?.name)
    .map((a: any, i: number): Article => {
      const title = a.title ?? '';
      const desc  = a.description ?? '';
      return {
        id:          String(i),
        source:      fmtSource(a.source?.name ?? 'NEWS'),
        title,
        description: desc,
        url:         a.url ?? '',
        publishedAt: a.publishedAt,
        ago:         timeAgo(a.publishedAt),
        sentiment:   detectSentiment(title, desc),
        category:    detectCategory(title, desc),
        tickers:     detectTickers(title, desc),
      };
    });
}

// ─── COLOR MAPS ───────────────────────────────────────────────────────────────
const TICKER_COLORS: Record<string, string> = {
  USD: C.green,  EUR: C.blue,   GBP: C.purple, JPY: '#ec4899',
  CAD: C.orange, AUD: '#eab308',CHF: C.teal,   NZD: C.cyan,
  BTC: C.amber,  ETH: '#818cf8',XRP: '#06b6d4',SOL: '#a78bfa', CNY: C.red,
};
function tickerColor(t: string): string {
  for (const k of Object.keys(TICKER_COLORS)) if (t.includes(k)) return TICKER_COLORS[k];
  return C.muted;
}
function sentimentColor(s: Sentiment): string {
  return s === 'POSITIVE' ? C.green : s === 'NEGATIVE' ? C.red : C.muted;
}
const CAT_COLORS: Record<string, string> = {
  Forex: C.amber, Commodities: C.orange, Futures: C.purple, Crypto: C.blue,
};

// ─── FILTER DATA ──────────────────────────────────────────────────────────────
const SENTIMENTS: SentimentFilter[] = ['All', 'Positive', 'Neutral', 'Negative'];
const CATEGORIES: CategoryFilter[]  = ['All', 'Forex', 'Commodities', 'Futures', 'Crypto'];

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.line} />
      <View style={[sk.line, { width: '60%', marginTop: 6 }]} />
      <View style={[sk.block, { marginTop: 12 }]} />
      <View style={[sk.block, { marginTop: 6, height: 10, width: '75%' }]} />
      <View style={[sk.block, { marginTop: 6, height: 10, width: '50%' }]} />
    </View>
  );
}
const sk = StyleSheet.create({
  card:  { backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, minHeight: 140 },
  line:  { height: 8,  borderRadius: 4, backgroundColor: C.dim, width: '40%' },
  block: { height: 12, borderRadius: 4, backgroundColor: C.dim },
});

// ─── CHIP ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, color, onPress }: {
  label: string; active: boolean; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={[
        cs.chip,
        active
          ? { backgroundColor: color + '22', borderColor: color }
          : { backgroundColor: 'transparent', borderColor: C.border },
      ]}
    >
      {active && <View style={[cs.dot, { backgroundColor: color }]} />}
      <Text style={[cs.txt, { color: active ? color : C.muted }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const cs = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, minHeight: 34,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  txt: { fontSize: 12, fontWeight: '700' },
});

// ─── NEWS CARD ────────────────────────────────────────────────────────────────
function NewsCard({ article, cols, onPress }: {
  article: Article; cols: number; onPress: () => void;
}) {
  const sc       = sentimentColor(article.sentiment);
  const cc       = CAT_COLORS[article.category] ?? C.cyan;
  const isSingle = cols === 1;

  return (
    <TouchableOpacity
      style={[ncs.card, isSingle && ncs.cardSingle]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Top row: source + sentiment badge */}
      <View style={ncs.topRow}>
        <Text style={ncs.source} numberOfLines={1}>{article.source}</Text>
        <View style={[ncs.sentBadge, { backgroundColor: sc + '1a', borderColor: sc + '55' }]}>
          <Text style={[ncs.sentTxt, { color: sc }]}>{article.sentiment}</Text>
        </View>
      </View>

      <Text style={ncs.ago}>{article.ago}</Text>

      {/* Title */}
      <Text
        style={[ncs.title, isSingle && ncs.titleLg]}
        numberOfLines={isSingle ? 2 : 3}
      >
        {article.title}
      </Text>

      {/* Description — only shown on single-column layout */}
      {isSingle && article.description ? (
        <Text style={ncs.desc} numberOfLines={2}>{article.description}</Text>
      ) : null}

      {/* Category + tickers */}
      <View style={ncs.tagsRow}>
        <View style={[ncs.catTag, { backgroundColor: cc + '18', borderColor: cc + '44' }]}>
          <Text style={[ncs.catTxt, { color: cc }]}>{article.category}</Text>
        </View>
        {article.tickers.map(t => (
          <View key={t} style={[ncs.ticker, { borderColor: tickerColor(t) + '88' }]}>
            <Text style={[ncs.tickerTxt, { color: tickerColor(t) }]}>{t}</Text>
          </View>
        ))}
      </View>

      {/* Read more */}
      <Text style={ncs.readMore}>Read more ›</Text>
    </TouchableOpacity>
  );
}

const ncs = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flex: 1,
    minHeight: 160,
  },
  cardSingle: { padding: 16, minHeight: 0, borderRadius: 14 },

  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2, gap: 6 },
  source:    { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.6, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  sentBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start' },
  sentTxt:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  ago:       { fontSize: 9, color: C.dim, marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  title:     { fontSize: 12, fontWeight: '700', color: C.sub, lineHeight: 17, marginBottom: 10 },
  titleLg:   { fontSize: 15, lineHeight: 22 },
  desc:      { fontSize: 12, color: C.muted, lineHeight: 18, marginBottom: 10 },
  tagsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  catTag:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  catTxt:    { fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  ticker:    { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  tickerTxt: { fontSize: 9, fontWeight: '700' },
  readMore:  { fontSize: 10, color: C.cyan, fontWeight: '600', marginTop: 'auto' as any },
});

// ─── ARTICLE MODAL ────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: Article | null; onClose: () => void }) {
  if (!article) return null;
  const sc = sentimentColor(article.sentiment);
  const cc = CAT_COLORS[article.category] ?? C.cyan;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <TouchableOpacity style={ms.backdrop} activeOpacity={1} onPress={onClose}>
        {/* Sheet must not bubble touches to backdrop */}
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={ms.sheet}>
            <View style={ms.handle} />

            {/* Meta row */}
            <View style={ms.metaRow}>
              <View style={[ms.catTag, { backgroundColor: cc + '22', borderColor: cc + '55' }]}>
                <Text style={[ms.catTxt, { color: cc }]}>{article.category.toUpperCase()}</Text>
              </View>
              <Text style={ms.source}>{article.source}</Text>
              <View style={{ flex: 1 }} />
              <View style={[ncs.sentBadge, { backgroundColor: sc + '1a', borderColor: sc + '55' }]}>
                <Text style={[ncs.sentTxt, { color: sc }]}>{article.sentiment}</Text>
              </View>
            </View>

            <Text style={ms.ago}>{article.ago}</Text>
            <Text style={ms.title}>{article.title}</Text>

            {/* Tickers */}
            {article.tickers.length > 0 && (
              <View style={[ncs.tagsRow, { marginBottom: 14 }]}>
                {article.tickers.map(t => (
                  <View key={t} style={[ncs.ticker, { borderColor: tickerColor(t) }]}>
                    <Text style={[ncs.tickerTxt, { color: tickerColor(t) }]}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={ms.divider} />

            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              <Text style={ms.body}>{article.description || 'No description available.'}</Text>
            </ScrollView>

            <View style={ms.actions}>
              <TouchableOpacity
                style={ms.openBtn}
                onPress={() => article.url && Linking.openURL(article.url)}
                activeOpacity={0.8}
              >
                <Text style={ms.openTxt}>Read Full Article ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={ms.closeTxt}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,8,20,0.92)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0c1424',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1, borderColor: C.border,
  },
  handle:  { width: 40, height: 4, backgroundColor: C.dim, borderRadius: 2, alignSelf: 'center', marginBottom: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  catTag:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  catTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  source:  { fontSize: 11, fontWeight: '600', color: C.muted },
  ago:     { fontSize: 10, color: C.dim, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  title:   { fontSize: 18, fontWeight: '800', color: C.text, lineHeight: 26, marginBottom: 12 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
  body:    { fontSize: 13, color: '#94a3b8', lineHeight: 22 },
  actions: { gap: 10, marginTop: 22 },
  openBtn: { backgroundColor: C.cyan + '22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.cyan + '44', minHeight: 52 },
  openTxt: { fontSize: 15, fontWeight: '700', color: C.cyan },
  closeBtn:{ backgroundColor: C.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center', minHeight: 52 },
  closeTxt:{ fontSize: 15, fontWeight: '700', color: C.muted },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function NewsScreen() {
  const cols          = useCols();
  const { width }     = useWindowDimensions();

  const [articles,    setArticles]   = useState<Article[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState<string | null>(null);
  const [refreshing,  setRefreshing] = useState(false);
  const [sentiment,   setSentiment]  = useState<SentimentFilter>('All');
  const [category,    setCategory]   = useState<CategoryFilter>('All');
  const [search,      setSearch]     = useState('');
  const [selected,    setSelected]   = useState<Article | null>(null);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchNews();
      setArticles(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 15 * 60 * 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = useMemo(() => articles.filter(a => {
    if (sentiment !== 'All' && a.sentiment !== sentiment.toUpperCase()) return false;
    if (category  !== 'All' && a.category  !== category)               return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [articles, sentiment, category, search]);

  // Card width: account for horizontal padding + inter-card gap
  const HPAD  = 16;
  const GAP   = cols > 1 ? 8 : 0;
  const cardW = (width - HPAD * 2 - GAP * (cols - 1)) / cols;

  // Rows of `cols` cards
  const rows = useMemo((): Article[][] => {
    const out: Article[][] = [];
    for (let i = 0; i < filtered.length; i += cols) out.push(filtered.slice(i, i + cols));
    return out;
  }, [filtered, cols]);

  const posCount  = filtered.filter(a => a.sentiment === 'POSITIVE').length;
  const neutCount = filtered.filter(a => a.sentiment === 'NEUTRAL').length;
  const negCount  = filtered.filter(a => a.sentiment === 'NEGATIVE').length;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Market News</Text>
          <Text style={s.headerSub}>Live market intelligence · Updated every 15 min</Text>
        </View>
        <View style={s.liveChip}>
          <View style={s.liveDot} />
          <Text style={s.liveTxt}>LIVE</Text>
        </View>
      </View>

      {/* ── FILTER STRIP ───────────────────────────────────────────── */}
      <View style={s.filterBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipRow}
          bounces={false}
        >
          {/* Sentiment chips */}
          {SENTIMENTS.map(id => {
            const color =
              id === 'Positive' ? C.green
              : id === 'Negative' ? C.red
              : id === 'Neutral'  ? C.muted
              : C.cyan;
            return (
              <Chip key={id} label={id} active={sentiment === id} color={color}
                onPress={() => setSentiment(id)} />
            );
          })}

          {/* Visual divider */}
          <View style={s.chipDivider} />

          {/* Category chips */}
          {CATEGORIES.map(id => {
            const color = id === 'All' ? C.cyan : (CAT_COLORS[id] ?? C.cyan);
            return (
              <Chip key={id} label={id} active={category === id} color={color}
                onPress={() => setCategory(id)} />
            );
          })}
        </ScrollView>
      </View>

      {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search headlines…"
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      {loading && !refreshing ? (
        // ── Skeleton ──
        <ScrollView contentContainerStyle={[s.scrollPad, { paddingTop: 8 }]}>
          {Array.from({ length: 3 }).map((_, ri) => (
            <View key={ri} style={[s.gridRow, { gap: GAP, marginBottom: GAP }]}>
              {Array.from({ length: cols }).map((_, ci) => (
                <View key={ci} style={{ width: cardW }}>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : error ? (
        // ── Error ──
        <View style={s.center}>
          <Text style={{ fontSize: 36 }}>⚠️</Text>
          <Text style={[s.ctaTxt, { fontWeight: '800', fontSize: 15, marginTop: 8 }]}>
            Failed to load
          </Text>
          <Text style={[s.ctaTxt, { textAlign: 'center', paddingHorizontal: 32, marginTop: 4, fontWeight: '400' }]}>
            {error}
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryTxt}>↺  Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── Feed ──
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollPad}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={C.green} colors={[C.green]} />
          }
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {/* Stats bar */}
          <View style={s.statsBar}>
            <Text style={s.statCount}>{filtered.length} articles</Text>
            <View style={s.statsRight}>
              {([
                { color: C.green, count: posCount  },
                { color: C.muted, count: neutCount },
                { color: C.red,   count: negCount  },
              ] as const).map(({ color, count }, i) => (
                <View key={i} style={s.statPill}>
                  <View style={[s.statDot, { backgroundColor: color }]} />
                  <Text style={[s.statN, { color }]}>{count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Grid or empty state */}
          {rows.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>📰</Text>
              <Text style={[s.ctaTxt, { marginTop: 16, fontSize: 15, fontWeight: '700' }]}>
                No articles match
              </Text>
              <Text style={[s.ctaTxt, { marginTop: 4 }]}>Try adjusting your filters</Text>
            </View>
          ) : (
            rows.map((row, ri) => (
              <View key={ri} style={[s.gridRow, { gap: GAP, marginBottom: GAP }]}>
                {row.map(a => (
                  <View key={a.id} style={{ width: cardW }}>
                    <NewsCard article={a} cols={cols} onPress={() => setSelected(a)} />
                  </View>
                ))}
                {/* Placeholder cells to keep last row aligned */}
                {row.length < cols &&
                  Array.from({ length: cols - row.length }).map((_, i) => (
                    <View key={`ph-${i}`} style={{ width: cardW }} />
                  ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <ArticleModal article={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

// ─── ROOT STYLES ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: C.muted, marginTop: 2 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.green + '18', borderWidth: 1, borderColor: C.green + '44',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  liveTxt: { fontSize: 10, fontWeight: '800', color: C.green, letterSpacing: 1 },

  // Filter strip
  filterBlock: { borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 8 },
  chipRow:     { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
  chipDivider: { width: 1, height: 22, backgroundColor: C.border, marginHorizontal: 2 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 46, gap: 8,
  },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, color: C.text, fontSize: 13, paddingVertical: 0, height: '100%' as any },
  clearBtn:    { fontSize: 13, color: C.muted, paddingHorizontal: 4 },

  // States
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  ctaTxt:   { fontSize: 13, color: C.muted, textAlign: 'center' },
  retryBtn: {
    marginTop: 20, paddingHorizontal: 32, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    height: 48, justifyContent: 'center', alignItems: 'center',
  },
  retryTxt: { fontSize: 14, fontWeight: '700', color: C.green },

  // Feed
  scroll:    { flex: 1 },
  scrollPad: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 52 },

  // Stats bar
  statsBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statCount:  { fontSize: 11, color: C.dim, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  statsRight: { flexDirection: 'row', gap: 12 },
  statPill:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDot:    { width: 6, height: 6, borderRadius: 3 },
  statN:      { fontSize: 11, fontWeight: '700' },

  // Grid
  gridRow: { flexDirection: 'row' },
  empty:   { alignItems: 'center', paddingTop: 80, gap: 2 },
});