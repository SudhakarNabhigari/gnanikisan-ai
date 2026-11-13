import type { VerifiedProduct } from '../../src/types';

interface CatalogRule {
  keywords: string[];
  crops: string[];
  products: VerifiedProduct[];
}

/**
 * Curated, safety-checked reference catalog of Indian agricultural inputs and bio-agents
 * using verified manufacturer/CIBRC/IFFCO portals. Never fabricates prices, stock, or dosages.
 */
const VERIFIED_CATALOG: CatalogRule[] = [
  {
    keywords: ['blast', 'rice blast', 'magnaporthe', 'leaf blast', 'neck blast'],
    crops: ['paddy', 'rice', 'vari'],
    products: [
      {
        name: 'Trichoderma viride Bio-Fungicide (IPM First-Line)',
        brand: 'IFFCO / ICAR Bio-Agent Reference',
        activeIngredient: 'Trichoderma viride (1% WP / Liquid)',
        formulation: 'Wettable Powder (WP) / Bio-agent',
        packSize: '1 kg / 500 g (Verify pack at KVK/dealer)',
        indicativePrice: null,
        sourceUrl: 'https://www.iffcobazar.in/',
        sourceLabel: 'IFFCO eBazar Official Portal',
        isBioOrIpm: true,
        labelInstruction:
          'Prefer bio-control & seed treatment per ICAR guidelines. Consult local KVK / Agriculture Officer before chemical sprays.',
      },
      {
        name: 'Beam 75 WP (Tricyclazole)',
        brand: 'Corteva Agriscience India',
        activeIngredient: 'Tricyclazole 75% WP',
        formulation: 'Wettable Powder (WP)',
        packSize: '120 g / 500 g',
        indicativePrice: null,
        sourceUrl: 'https://www.corteva.in/',
        sourceLabel: 'Corteva India Official Website',
        isBioOrIpm: false,
        labelInstruction:
          'Read CIBRC-registered product label strictly. Do not apply without confirming rice blast diagnosis with your local Agriculture Officer.',
      },
      {
        name: 'Amistar Top (Azoxystrobin + Difenoconazole)',
        brand: 'Syngenta India',
        activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% w/w SC',
        formulation: 'Suspension Concentrate (SC)',
        packSize: '100 ml / 200 ml / 500 ml',
        indicativePrice: null,
        sourceUrl: 'https://www.syngenta.co.in/',
        sourceLabel: 'Syngenta India Official Portal',
        isBioOrIpm: false,
        labelInstruction:
          'Follow official CIBRC label directions, pre-harvest interval, and PPE safety instructions. Verify dosage with local KVK expert.',
      },
    ],
  },
  {
    keywords: ['bacterial', 'blight', 'blb', 'xanthomonas', 'leaf blight'],
    crops: ['paddy', 'rice', 'vari', 'cotton'],
    products: [
      {
        name: 'Pseudomonas fluorescens Bio-Bactericide',
        brand: 'ICAR / State Agro Bio-Lab Reference',
        activeIngredient: 'Pseudomonas fluorescens 1.0% WP',
        formulation: 'Wettable Powder (WP)',
        packSize: '1 kg',
        indicativePrice: null,
        sourceUrl: 'https://farmer.gov.in/',
        sourceLabel: 'Dept. of Agriculture & Farmers Welfare (farmer.gov.in)',
        isBioOrIpm: true,
        labelInstruction:
          'Drain excess standing water and reduce high nitrogen top-dressing first. Follow KVK biological management guidance.',
      },
      {
        name: 'Blitox (Copper Oxychloride 50% WP)',
        brand: 'Rallis India',
        activeIngredient: 'Copper Oxychloride 50% WP',
        formulation: 'Wettable Powder (WP)',
        packSize: '500 g / 1 kg',
        indicativePrice: null,
        sourceUrl: 'https://www.rallis.com/',
        sourceLabel: 'Rallis India Official Website',
        isBioOrIpm: false,
        labelInstruction:
          'Confirm bacterial vs fungal symptoms locally. Follow registered label restrictions and local Agriculture Officer guidance.',
      },
    ],
  },
  {
    keywords: ['thrips', 'mite', 'aphid', 'whitefly', 'jassid', 'sucking', 'leaf curl'],
    crops: ['chilli', 'cotton', 'patti', 'groundnut', 'maize', 'red gram'],
    products: [
      {
        name: 'Neem Oil (Azadirachtin 1500 ppm / 3000 ppm)',
        brand: 'CIBRC Registered Botanical Reference',
        activeIngredient: 'Azadirachtin (Neem Kernel Extract)',
        formulation: 'Emulsifiable Concentrate (EC)',
        packSize: '250 ml / 500 ml / 1 L',
        indicativePrice: null,
        sourceUrl: 'https://www.iffcobazar.in/',
        sourceLabel: 'IFFCO eBazar Official Portal',
        isBioOrIpm: true,
        labelInstruction:
          'IPM first-line botanical option. Pair with yellow/blue sticky traps and follow label directions.',
      },
      {
        name: 'Confidor (Imidacloprid 17.8% SL)',
        brand: 'Bayer CropScience India',
        activeIngredient: 'Imidacloprid 17.8% SL',
        formulation: 'Soluble Liquid (SL)',
        packSize: '100 ml / 250 ml / 500 ml',
        indicativePrice: null,
        sourceUrl: 'https://www.cropscience.bayer.in/',
        sourceLabel: 'Bayer CropScience India Official Portal',
        isBioOrIpm: false,
        labelInstruction:
          'Avoid spraying during peak bee foraging hours. Use only after pest threshold verification and strictly per registered label.',
      },
      {
        name: 'Pegasus (Diafenthiuron 50% WP)',
        brand: 'Syngenta India',
        activeIngredient: 'Diafenthiuron 50% WP',
        formulation: 'Wettable Powder (WP)',
        packSize: '250 g / 500 g',
        indicativePrice: null,
        sourceUrl: 'https://www.syngenta.co.in/',
        sourceLabel: 'Syngenta India Official Portal',
        isBioOrIpm: false,
        labelInstruction:
          'Consult local KVK / Agriculture Officer to verify crop registration and label dosage before application.',
      },
    ],
  },
  {
    keywords: ['bollworm', 'armyworm', 'caterpillar', 'borer', 'pod borer', 'larva', 'spodoptera'],
    crops: ['maize', 'jonna', 'cotton', 'patti', 'red gram', 'kandi', 'chilli'],
    products: [
      {
        name: 'Bacillus thuringiensis (Bt) / NPV Bio-Larvicide',
        brand: 'ICAR IPM Bio-Control Reference',
        activeIngredient: 'Bacillus thuringiensis var. kurstaki / HaNPV',
        formulation: 'WP / Liquid Suspension',
        packSize: '250 g / 500 ml',
        indicativePrice: null,
        sourceUrl: 'https://ppqs.gov.in/',
        sourceLabel: 'Directorate of Plant Protection (ppqs.gov.in)',
        isBioOrIpm: true,
        labelInstruction:
          'Prioritize pheromone traps and bio-larvicides at early larval instars. Confirm species with local KVK before spraying.',
      },
      {
        name: 'Coragen (Chlorantraniliprole 18.5% SC)',
        brand: 'FMC India',
        activeIngredient: 'Chlorantraniliprole 18.5% w/w SC',
        formulation: 'Suspension Concentrate (SC)',
        packSize: '60 ml / 150 ml',
        indicativePrice: null,
        sourceUrl: 'https://ag.fmc.com/in/en',
        sourceLabel: 'FMC India Official Portal',
        isBioOrIpm: false,
        labelInstruction:
          'Follow official CIBRC label directions, crop-stage restrictions, and local Agriculture Officer guidance.',
      },
    ],
  },
  {
    keywords: ['tikka', 'leaf spot', 'cercospora', 'rust', 'powdery mildew', 'anthracnose', 'spot'],
    crops: ['groundnut', 'chilli', 'cotton', 'red gram', 'maize'],
    products: [
      {
        name: 'Trichoderma / Neem Seed Kernel Extract (IPM)',
        brand: 'ICAR IPM Reference',
        activeIngredient: 'Trichoderma spp. / Botanical Extract',
        formulation: 'WP / Liquid',
        packSize: '500 g / 1 L',
        indicativePrice: null,
        sourceUrl: 'https://ppqs.gov.in/',
        sourceLabel: 'PPQS Integrated Pest Management Portal',
        isBioOrIpm: true,
        labelInstruction:
          'Remove heavily infected lower foliage and improve field drainage. Verify severity with KVK before fungicide use.',
      },
      {
        name: 'Nativo (Tebuconazole 50% + Trifloxystrobin 25% WG)',
        brand: 'Bayer CropScience India',
        activeIngredient: 'Tebuconazole 50% + Trifloxystrobin 25% WG',
        formulation: 'Water Dispersible Granules (WG)',
        packSize: '100 g / 250 g',
        indicativePrice: null,
        sourceUrl: 'https://www.cropscience.bayer.in/',
        sourceLabel: 'Bayer CropScience India Official Portal',
        isBioOrIpm: false,
        labelInstruction:
          'Verify crop registration on the physical CIBRC label and consult your local Agriculture Officer.',
      },
    ],
  },
];

export function findVerifiedProductsForDiagnosis(
  crop: string,
  issue: string,
  isUnclear: boolean
): VerifiedProduct[] {
  // Safety rule: Do not prescribe chemicals based only on an uncertain image diagnosis.
  if (isUnclear) {
    return [];
  }

  const hay = `${crop} ${issue}`.toLowerCase();
  const scored: { score: number; products: VerifiedProduct[] }[] = [];

  for (const rule of VERIFIED_CATALOG) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (hay.includes(kw)) score += 3;
    }
    for (const c of rule.crops) {
      if (hay.includes(c)) score += 2;
    }
    if (score >= 3) {
      scored.push({ score, products: rule.products });
    }
  }

  if (scored.length === 0) {
    return [];
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0].products.slice(0, 3);
}
