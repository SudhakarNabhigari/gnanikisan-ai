import fs from 'node:fs';
import path from 'node:path';
import type {
  FarmDetails,
  GovernmentScheme,
  MandiPriceRow,
  MandiPricesResponse,
  UserLocation,
  WeatherData,
} from '../../src/types';
import { isMandiApiConfigured } from './integrations';

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  71: 'Slight Snow',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
};

export function describeWmoCode(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Variable Clouds';
}

export async function fetchLiveWeather(lat?: number, lon?: number): Promise<WeatherData> {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return {
      status: 'unavailable',
      source: 'Open-Meteo Live Weather',
      updatedAt: new Date().toISOString(),
      message: 'Coordinates required for live weather. Allow GPS or select a geocoded location.',
    };
  }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
    );
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '4');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Weather API responded ${res.status}`);
    }

    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };

    const current = json.current ?? {};
    const daily = json.daily ?? {};
    const times = daily.time ?? [];
    const forecast = times.slice(1, 4).map((dateStr, idx) => {
      const i = idx + 1;
      const code = daily.weather_code?.[i] ?? 2;
      const dt = new Date(`${dateStr}T00:00:00`);
      const dayName = dt.toLocaleDateString('en-IN', { weekday: 'short' });
      return {
        date: dateStr,
        dayName,
        tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 0),
        tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 0),
        condition: describeWmoCode(code),
        code,
        rainChance: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
      };
    });

    const todayCode = current.weather_code ?? 2;

    return {
      status: 'live',
      temperatureC: Math.round(current.temperature_2m ?? 0),
      condition: describeWmoCode(todayCode),
      weatherCode: todayCode,
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windKmh: Math.round(current.wind_speed_10m ?? 0),
      rainChance: Math.round(daily.precipitation_probability_max?.[0] ?? 0),
      forecast,
      source: 'Open-Meteo Live Weather',
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: 'unavailable',
      source: 'Open-Meteo Live Weather',
      updatedAt: new Date().toISOString(),
      message: err instanceof Error ? err.message : 'Unable to reach weather service.',
    };
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<UserLocation> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('zoom', '12');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'GnaniKisanAI/1.0 (Agricultural Assistant)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Geocoding service responded ${res.status}`);
  }

  const data = (await res.json()) as {
    display_name?: string;
    address?: {
      village?: string;
      town?: string;
      city?: string;
      suburb?: string;
      county?: string;
      state_district?: string;
      state?: string;
    };
  };

  const addr = data.address ?? {};
  const village = addr.village || addr.town || addr.city || addr.suburb || '';
  const district = addr.state_district || addr.county || '';
  const state = addr.state || '';
  const parts = [village, district, state].filter(Boolean);
  const name = parts.length > 0 ? parts.slice(0, 2).join(', ') : data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  return {
    name,
    village: village || undefined,
    district: district || undefined,
    state: state || undefined,
    lat,
    lon,
    source: 'gps',
  };
}

export async function searchLocations(query: string): Promise<UserLocation[]> {
  const clean = query.trim();
  if (!clean) return [];

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', clean);
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '5');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'GnaniKisanAI/1.0 (Agricultural Assistant)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Location search failed (${res.status})`);
  }

  const rows = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: {
      village?: string;
      town?: string;
      city?: string;
      county?: string;
      state_district?: string;
      state?: string;
    };
  }>;

  return rows.map((r) => {
    const addr = r.address ?? {};
    const village = addr.village || addr.town || addr.city || '';
    const district = addr.state_district || addr.county || '';
    const state = addr.state || '';
    const parts = [village, district, state].filter(Boolean);
    return {
      name: parts.length > 0 ? parts.slice(0, 2).join(', ') : r.display_name.split(',').slice(0, 2).join(', '),
      village: village || undefined,
      district: district || undefined,
      state: state || undefined,
      lat: Number.parseFloat(r.lat),
      lon: Number.parseFloat(r.lon),
      source: 'manual',
    };
  });
}

const AGMARKNET_RESOURCE_URL =
  'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

interface NormalizedAgmarknetRecord {
  commodity: string;
  market: string;
  district: string;
  state: string;
  variety: string;
  modalPrice: number;
  minPrice?: number;
  maxPrice?: number;
  arrivalDate: string;
}

function getCropMatchTokens(crop: string): string[] {
  const lower = crop.toLowerCase().trim();
  if (lower.includes('paddy') || lower.includes('vari') || lower.includes('rice')) {
    return ['paddy', 'dhan', 'rice'];
  }
  if (lower.includes('maize') || lower.includes('jonna')) {
    return ['maize', 'jonna', 'jowar', 'corn'];
  }
  if (lower.includes('cotton') || lower.includes('patti')) {
    return ['cotton', 'kapas'];
  }
  if (lower.includes('chilli') || lower.includes('chili')) {
    return ['chilli', 'chili', 'mirch'];
  }
  if (lower.includes('groundnut') || lower.includes('peanut')) {
    return ['groundnut', 'peanut'];
  }
  if (lower.includes('red gram') || lower.includes('kandi') || lower.includes('arhar') || lower.includes('tur')) {
    return ['arhar', 'tur', 'red gram', 'pigeon'];
  }
  const base = lower.split('(')[0].trim();
  return base ? [base] : [lower];
}

function normalizeAgmarknetRecord(raw: Record<string, unknown>): NormalizedAgmarknetRecord | null {
  const getStr = (...keys: string[]) => {
    for (const k of keys) {
      const val = raw[k];
      if (typeof val === 'string' && val.trim()) return val.trim();
      if (typeof val === 'number') return String(val);
    }
    return '';
  };
  const getNum = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const val = raw[k];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const n = Number(String(val).replace(/,/g, '').trim());
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    return undefined;
  };

  const commodity = getStr('commodity', 'Commodity', 'Commodity_Name', 'commodity_name');
  const modalPrice = getNum('modal_price', 'Modal_Price', 'modalPrice');
  if (!commodity || !modalPrice) return null;

  return {
    commodity,
    market: getStr('market', 'Market', 'market_name') || 'APMC Mandi',
    district: getStr('district', 'District', 'district_name'),
    state: getStr('state', 'State', 'state_name'),
    variety: getStr('variety', 'Variety'),
    modalPrice,
    minPrice: getNum('min_price', 'Min_Price', 'minPrice'),
    maxPrice: getNum('max_price', 'Max_Price', 'maxPrice'),
    arrivalDate: getStr('arrival_date', 'Arrival_Date', 'arrivalDate'),
  };
}

const MANDI_CACHE_FILE = path.resolve(process.cwd(), '.data', 'mandi-cache.json');

interface MandiCacheEntry {
  cacheKey: string;
  state?: string;
  dataDate?: string;
  fetchedAt: string;
  items: MandiPriceRow[];
}

function readMandiCacheStore(): Record<string, MandiCacheEntry> {
  try {
    if (!fs.existsSync(MANDI_CACHE_FILE)) return {};
    const parsed = JSON.parse(fs.readFileSync(MANDI_CACHE_FILE, 'utf8')) as Record<
      string,
      MandiCacheEntry
    >;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMandiCacheEntry(entry: MandiCacheEntry): void {
  try {
    const dir = path.dirname(MANDI_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const existing = readMandiCacheStore();
    existing[entry.cacheKey] = entry;
    const temp = `${MANDI_CACHE_FILE}.tmp.${process.pid}`;
    fs.writeFileSync(temp, JSON.stringify(existing, null, 2), 'utf8');
    fs.renameSync(temp, MANDI_CACHE_FILE);
  } catch {
    // Non-fatal cache write failure
  }
}

function getCachedMandiForQuery(
  crops: string[],
  location: UserLocation | null
): MandiCacheEntry | null {
  const cache = readMandiCacheStore();
  const stateKey = (location?.state || '').trim().toLowerCase() || 'national';
  const candidateKeys = [stateKey, 'national'];
  for (const key of candidateKeys) {
    const entry = cache[key];
    if (!entry || !Array.isArray(entry.items) || entry.items.length === 0) continue;
    const cropMatches = entry.items.filter((item) =>
      crops.some((c) => {
        const tokens = getCropMatchTokens(c);
        const hay = `${item.crop} ${item.commodity ?? ''}`.toLowerCase();
        return tokens.some((tok) => hay.includes(tok));
      })
    );
    if (cropMatches.length > 0) {
      return { ...entry, items: cropMatches };
    }
  }
  return null;
}

async function queryAgmarknetBatch(
  apiKey: string,
  opts: {
    state?: string;
    stateParamName?: 'filters[state]' | 'filters[state.keyword]' | 'filters[State]';
    limit?: number;
  }
): Promise<NormalizedAgmarknetRecord[]> {
  const url = new URL(AGMARKNET_RESOURCE_URL);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(opts.limit ?? 300));
  if (opts.state) {
    url.searchParams.set(opts.stateParamName ?? 'filters[state]', opts.state);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GnaniKisanAI/1.0 (Agricultural Mandi Client)',
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    const e = err as {
      name?: string;
      message?: string;
      code?: string;
      cause?: { code?: string; address?: string; port?: number; message?: string };
    };
    const causeCode = e?.cause?.code || e?.code || '';
    const hostTarget = e?.cause?.address
      ? `${e.cause.address}${e.cause.port ? `:${e.cause.port}` : ''}`
      : 'api.data.gov.in';

    if (
      e?.name === 'TimeoutError' ||
      e?.name === 'AbortError' ||
      causeCode === 'ETIMEDOUT' ||
      causeCode === 'UND_ERR_CONNECT_TIMEOUT'
    ) {
      const wrapped = new Error(
        `Request to official data.gov.in AGMARKNET API timed out after 10s (${hostTarget}).`
      ) as Error & { errorCode?: MandiPricesResponse['errorCode'] };
      wrapped.errorCode = 'TIMEOUT';
      throw wrapped;
    }
    if (causeCode === 'ECONNREFUSED') {
      const wrapped = new Error(
        `Connection refused by api.data.gov.in (${hostTarget}). Outbound HTTPS to NIC data.gov.in is blocked or refused from this hosting environment.`
      ) as Error & { errorCode?: MandiPricesResponse['errorCode'] };
      wrapped.errorCode = 'CONNECTION_REFUSED';
      throw wrapped;
    }
    const detail = causeCode ? `${causeCode} (${hostTarget})` : e?.message || 'Network failure';
    const wrapped = new Error(`Could not connect to api.data.gov.in: ${detail}`) as Error & {
      errorCode?: MandiPricesResponse['errorCode'];
    };
    wrapped.errorCode = 'NETWORK_ERROR';
    throw wrapped;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let errorCode: MandiPricesResponse['errorCode'] = 'DATASET_UNAVAILABLE';
    let msg = `AGMARKNET API responded HTTP ${res.status}${errText ? `: ${errText.slice(0, 120)}` : ''}`;

    if (res.status === 401 || res.status === 403) {
      errorCode = 'INVALID_API_KEY';
      msg = `data.gov.in rejected DATA_GOV_API_KEY (HTTP ${res.status}). Check that the API key is active and authorized for AGMARKNET dataset 9ef84268-d588-465a-a308-a864a43d0070.`;
    } else if (res.status === 429) {
      errorCode = 'RATE_LIMITED';
      msg = 'data.gov.in rate limit exceeded (HTTP 429). Please retry in a moment.';
    } else if (res.status === 404) {
      errorCode = 'DATASET_UNAVAILABLE';
      msg =
        'Official AGMARKNET dataset resource (9ef84268-d588-465a-a308-a864a43d0070) returned HTTP 404 Not Found.';
    }

    const wrapped = new Error(msg) as Error & { errorCode?: MandiPricesResponse['errorCode'] };
    wrapped.errorCode = errorCode;
    throw wrapped;
  }

  const data = (await res.json()) as {
    status?: string;
    message?: string;
    error?: string;
    records?: Array<Record<string, unknown>>;
  };

  if (data.status === 'error' || data.error) {
    const rawMsg = String(data.message || data.error || 'AGMARKNET API returned an error status.');
    const lower = rawMsg.toLowerCase();
    const wrapped = new Error(rawMsg) as Error & { errorCode?: MandiPricesResponse['errorCode'] };
    wrapped.errorCode =
      lower.includes('key') || lower.includes('auth') || lower.includes('invalid')
        ? 'INVALID_API_KEY'
        : lower.includes('limit') || lower.includes('quota')
          ? 'RATE_LIMITED'
          : 'DATASET_UNAVAILABLE';
    throw wrapped;
  }

  const rawRecords = Array.isArray(data.records) ? data.records : [];
  return rawRecords
    .map(normalizeAgmarknetRecord)
    .filter((r): r is NormalizedAgmarknetRecord => r !== null);
}

export async function fetchMandiPrices(
  crops: string[],
  location: UserLocation | null
): Promise<MandiPricesResponse> {
  const selected = crops.length > 0 ? crops : ['Paddy (Vari)'];
  const now = new Date().toISOString();

  if (!isMandiApiConfigured()) {
    return {
      status: 'not_configured',
      errorCode: 'NOT_CONFIGURED',
      isDemo: false,
      source: 'AGMARKNET (data.gov.in)',
      fetchedAt: now,
      updatedAt: now,
      items: [],
      notice:
        'DATA_GOV_API_KEY is not configured on the server. Add your data.gov.in API key to load live mandi prices.',
    };
  }

  const apiKey = (process.env.DATA_GOV_API_KEY ?? '').trim();

  try {
    let stateRecords: NormalizedAgmarknetRecord[] = [];
    if (location?.state?.trim()) {
      const cleanState = location.state.trim();
      stateRecords = await queryAgmarknetBatch(apiKey, {
        state: cleanState,
        stateParamName: 'filters[state]',
        limit: 300,
      });
      if (stateRecords.length === 0) {
        stateRecords = await queryAgmarknetBatch(apiKey, {
          state: cleanState,
          stateParamName: 'filters[state.keyword]',
          limit: 300,
        });
      }
      if (stateRecords.length === 0) {
        stateRecords = await queryAgmarknetBatch(apiKey, {
          state: cleanState,
          stateParamName: 'filters[State]',
          limit: 300,
        });
      }
    }

    let nationalRecords: NormalizedAgmarknetRecord[] = [];
    const findMatch = (cropName: string, pool: NormalizedAgmarknetRecord[]) => {
      const tokens = getCropMatchTokens(cropName);
      const districtLower = (location?.district ?? '').toLowerCase().trim();
      const matches = pool.filter((rec) => {
        const commLower = rec.commodity.toLowerCase();
        return tokens.some((tok) => commLower.includes(tok));
      });
      if (matches.length === 0) return null;
      if (districtLower) {
        const distMatch = matches.find((m) => m.district.toLowerCase().includes(districtLower));
        if (distMatch) return distMatch;
      }
      return matches[0];
    };

    const items: MandiPriceRow[] = [];
    const missingAfterState: string[] = [];

    const toRow = (crop: string, hit: NormalizedAgmarknetRecord): MandiPriceRow => ({
      crop,
      commodity: hit.commodity,
      market: `${hit.market}${hit.district ? `, ${hit.district}` : ''}`,
      state: hit.state || location?.state,
      district: hit.district || undefined,
      variety: hit.variety || undefined,
      pricePerQuintal: hit.modalPrice,
      minPrice: hit.minPrice,
      maxPrice: hit.maxPrice,
      changePercent: 0,
      unit: '₹/quintal',
      arrivalDate: hit.arrivalDate || undefined,
      updatedAt: hit.arrivalDate || now,
    });

    for (const crop of selected.slice(0, 6)) {
      const hit = findMatch(crop, stateRecords);
      if (hit) {
        items.push(toRow(crop, hit));
      } else {
        missingAfterState.push(crop);
      }
    }

    if (missingAfterState.length > 0) {
      nationalRecords = await queryAgmarknetBatch(apiKey, { limit: 350 });
      for (const crop of missingAfterState) {
        const hit = findMatch(crop, nationalRecords);
        if (hit) {
          items.push(toRow(crop, hit));
        }
      }
    }

    if (items.length > 0) {
      const latestArrival = items.find((i) => i.arrivalDate)?.arrivalDate || now.slice(0, 10);
      const cacheKey = (location?.state || '').trim().toLowerCase() || 'national';
      writeMandiCacheEntry({
        cacheKey,
        state: location?.state,
        dataDate: latestArrival,
        fetchedAt: now,
        items,
      });
      return {
        status: 'live',
        isDemo: false,
        source: 'AGMARKNET (data.gov.in)',
        dataDate: latestArrival,
        fetchedAt: now,
        updatedAt: now,
        items,
        notice: 'Live mandi prices fetched from AGMARKNET (data.gov.in).',
      };
    }

    return {
      status: 'empty',
      isDemo: false,
      source: 'AGMARKNET (data.gov.in)',
      fetchedAt: now,
      updatedAt: now,
      items: [],
      notice:
        'Connected to AGMARKNET (data.gov.in), but no mandi price arrivals matched your selected crops in the latest feed.',
    };
  } catch (err) {
    const typedErr = err as Error & { errorCode?: MandiPricesResponse['errorCode'] };
    const reason = typedErr instanceof Error ? typedErr.message : 'Unable to reach data.gov.in API.';
    const cached = getCachedMandiForQuery(selected, location);
    if (cached) {
      return {
        status: 'cached',
        errorCode: typedErr?.errorCode || 'NETWORK_ERROR',
        isDemo: false,
        source: 'AGMARKNET (data.gov.in)',
        dataDate: cached.dataDate,
        fetchedAt: now,
        cachedAt: cached.fetchedAt,
        updatedAt: cached.fetchedAt,
        items: cached.items,
        error: reason,
        notice: `Live AGMARKNET feed temporarily unavailable (${reason}). Showing last verified AGMARKNET prices from ${cached.dataDate || cached.fetchedAt.slice(0, 10)}.`,
      };
    }
    return {
      status: 'unavailable',
      errorCode: typedErr?.errorCode || 'NETWORK_ERROR',
      isDemo: false,
      source: 'AGMARKNET (data.gov.in)',
      fetchedAt: now,
      updatedAt: now,
      items: [],
      error: reason,
      notice: reason,
    };
  }
}

export function getRecommendedSchemes(
  farm: FarmDetails,
  location: UserLocation | null
): GovernmentScheme[] {
  const stateLower = (location?.state || location?.name || '').toLowerCase();
  const hasLand = farm.landArea > 0;
  const isSmallMarginal = farm.landArea > 0 && (farm.landUnit === 'Acres' ? farm.landArea <= 5 : farm.landArea <= 2);

  const schemes: GovernmentScheme[] = [
    {
      id: 'pm-kisan',
      name: 'PM-KISAN Samman Nidhi',
      category: 'Direct Income Support',
      benefit: '₹6,000 per year (in 3 equal installments of ₹2,000) to eligible landholding farmer families.',
      eligibilityStatus: hasLand ? 'Criteria Matched (Verify on Portal)' : 'Potentially Relevant',
      eligibilityReason: hasLand
        ? `Landholding (${farm.landArea} ${farm.landUnit}) entered; confirm Aadhaar & e-KYC on official portal.`
        : 'Add landholding details in My Farm Details and confirm Aadhaar land records on portal.',
      officialUrl: 'https://pmkisan.gov.in/',
      lastVerified: '2026-11-01',
      applicableStates: ['All India'],
    },
    {
      id: 'pmfby',
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      category: 'Crop Insurance',
      benefit: 'Subsidized crop insurance protecting notified crops against non-preventable natural risks.',
      eligibilityStatus: farm.crops.length > 0 ? 'Criteria Matched (Verify on Portal)' : 'Potentially Relevant',
      eligibilityReason: `Selected crops (${farm.crops.join(', ') || 'None'}) may be covered under district-notified seasonal crop lists.`,
      officialUrl: 'https://pmfby.gov.in/',
      lastVerified: '2026-11-01',
      applicableStates: ['All India'],
    },
    {
      id: 'kcc',
      name: 'Kisan Credit Card (KCC)',
      category: 'Short-Term Crop Credit',
      benefit: 'Timely institutional credit for cultivation expenses with interest subvention for prompt repayment.',
      eligibilityStatus: 'Potentially Relevant',
      eligibilityReason: 'Available to cultivator farmers through commercial, cooperative, and regional rural banks.',
      officialUrl: 'https://www.myscheme.gov.in/schemes/kcc',
      lastVerified: '2026-11-01',
      applicableStates: ['All India'],
    },
    {
      id: 'soil-health-card',
      name: 'Soil Health Card Scheme',
      category: 'Soil Testing & Nutrient Advisory',
      benefit: 'Crop-wise soil nutrient recommendations to help reduce excess fertilizer costs.',
      eligibilityStatus: 'Criteria Matched (Verify on Portal)',
      eligibilityReason: `Soil type recorded as ${farm.soilType}; request local testing via district agriculture office.`,
      officialUrl: 'https://soilhealth.dac.gov.in/',
      lastVerified: '2026-11-01',
      applicableStates: ['All India'],
    },
    {
      id: 'pm-kusum',
      name: 'PM-KUSUM Solar Irrigation Scheme',
      category: 'Solar Pumps & Irrigation',
      benefit: 'Subsidy support for standalone solar agriculture pumps and grid-connected pump solarization.',
      eligibilityStatus:
        farm.irrigation === 'Borewell' || farm.irrigation === 'Drip' || farm.irrigation === 'Sprinkler'
          ? 'Criteria Matched (Verify on Portal)'
          : 'Potentially Relevant',
      eligibilityReason: `Irrigation listed as ${farm.irrigation}; check state nodal agency allocation.`,
      officialUrl: 'https://pmkusum.mnre.gov.in/',
      lastVerified: '2026-11-01',
      applicableStates: ['All India'],
    },
  ];

  if (stateLower.includes('andhra') || stateLower.includes('ap') || stateLower.includes('rajahmundry')) {
    schemes.unshift({
      id: 'ap-annadata',
      name: 'Andhra Pradesh Annadata Sukhibhava / Rythu Bharosa',
      category: 'State Farmer Investment Support',
      benefit: 'State financial investment assistance for eligible Andhra Pradesh cultivating farmers.',
      eligibilityStatus: isSmallMarginal ? 'Criteria Matched (Verify on Portal)' : 'Potentially Relevant',
      eligibilityReason: 'Location matches Andhra Pradesh; verify land records and e-KYC at Rythu Seva Kendra.',
      officialUrl: 'https://karshak.ap.gov.in/',
      lastVerified: '2026-11-01',
      applicableStates: ['Andhra Pradesh'],
    });
  } else if (stateLower.includes('telangana') || stateLower.includes('hyderabad') || stateLower.includes('warangal')) {
    schemes.unshift({
      id: 'ts-rythu-bharosa',
      name: 'Telangana Rythu Bharosa',
      category: 'State Seasonal Investment Support',
      benefit: 'Per-acre seasonal cultivation assistance for eligible Telangana farmers.',
      eligibilityStatus: hasLand ? 'Criteria Matched (Verify on Portal)' : 'Potentially Relevant',
      eligibilityReason: 'Location matches Telangana; verify pattadar passbook and portal status.',
      officialUrl: 'https://rythubandhu.telangana.gov.in/',
      lastVerified: '2026-11-01',
      applicableStates: ['Telangana'],
    });
  }

  return schemes;
}
