import type { AppLanguage, VerifiedProduct } from '../../src/types';

interface CatalogRule {
  keywords: string[];
  crops: string[];
  products: VerifiedProduct[];
}

function buildProductGoogleSearchUrl(name: string, brand: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} ${brand}`.trim())}`;
}

/**
 * Curated, safety-checked reference catalog of Indian agricultural inputs and bio-agents
 * using HTTP-verified manufacturer/authorized retailer product pages or Google Search fallback.
 * Never fabricates URLs, prices, stock, or dosages.
 */
const VERIFIED_CATALOG: CatalogRule[] = [
  {
    keywords: ['blast', 'rice blast', 'magnaporthe', 'leaf blast', 'neck blast'],
    crops: ['paddy', 'rice', 'vari'],
    products: [
      {
        name: 'EBS Trichoderma Viride Bio-Fungicide',
        brand: 'EBS (Eco Bio Solutions) / ICAR Bio-Agent Reference',
        activeIngredient: 'Trichoderma viride',
        formulation: 'Bio-Fungicide Powder',
        packSize: '1 kg / 500 g (Verify pack at KVK/dealer)',
        indicativePrice: null,
        sourceUrl: 'https://www.bighaat.com/products/ebs-trichoderma-viride-bio-fungicide',
        sourceLabel: 'BigHaat Verified Product Page',
        linkType: 'product',
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
        sourceUrl: 'https://www.bighaat.com/products/beam-fungicide',
        sourceLabel: 'BigHaat Authorized Corteva Beam Page',
        linkType: 'product',
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
        sourceUrl: 'https://www.bighaat.com/products/amistar-top-fungicide',
        sourceLabel: 'BigHaat Authorized Syngenta Amistar Top Page',
        linkType: 'product',
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
        name: 'Striker (Pseudomonas fluorescens 1% WP)',
        brand: 'Katyayani Organics / Bio-Control Reference',
        activeIngredient: 'Pseudomonas fluorescens 1.0% WP',
        formulation: 'Talcum-based Wettable Powder (WP)',
        packSize: '1 kg',
        indicativePrice: null,
        sourceUrl:
          'https://www.bighaat.com/products/katyayani-pseudomonas-fluorescens-bio-fungicide-powder',
        sourceLabel: 'BigHaat Verified Product Page',
        linkType: 'product',
        isBioOrIpm: true,
        labelInstruction:
          'Drain excess standing water and reduce high nitrogen top-dressing first. Follow KVK biological management guidance.',
      },
      {
        name: 'Blitox (Copper Oxychloride 50% WP)',
        brand: 'Tata Rallis India',
        activeIngredient: 'Copper Oxychloride 50% WP',
        formulation: 'Wettable Powder (WP)',
        packSize: '500 g / 1 kg',
        indicativePrice: null,
        sourceUrl: 'https://www.bighaat.com/products/tata-rallis-blitox-fungicide',
        sourceLabel: 'BigHaat Authorized Tata Rallis Blitox Page',
        linkType: 'product',
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
        name: 'Dr. Neem 5000 (Azadirachtin 5000 PPM)',
        brand: 'Katyayani Organics',
        activeIngredient: 'Azadirachtin 5000 ppm (Neem Kernel Extract)',
        formulation: 'Botanical Liquid Concentrate',
        packSize: '250 ml / 500 ml / 1 L',
        indicativePrice: null,
        sourceUrl:
          'https://www.bighaat.com/products/katyayani-dr-neem-oil-insecticide-5000-ppm',
        sourceLabel: 'BigHaat Verified Product Page',
        linkType: 'product',
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
        sourceUrl: 'https://www.bayercropscience.in/en/protect-crops/insecticides/confidor',
        sourceLabel: 'Bayer CropScience India Official Product Page',
        linkType: 'product',
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
        sourceUrl: 'https://www.bighaat.com/products/pegasus-insecticide',
        sourceLabel: 'BigHaat Authorized Syngenta Pegasus Page',
        linkType: 'product',
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
        sourceUrl: buildProductGoogleSearchUrl(
          'Bacillus thuringiensis Bt bio-larvicide India agriculture',
          'ICAR IPM'
        ),
        sourceLabel: 'Google Product Search',
        linkType: 'search',
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
        sourceUrl: 'https://ag.fmc.com/in/en/insecticides/coragen-insecticide',
        sourceLabel: 'FMC India Official Product Page',
        linkType: 'product',
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
        sourceUrl: buildProductGoogleSearchUrl(
          'Trichoderma Neem Seed Kernel Extract bio-fungicide India',
          'ICAR IPM'
        ),
        sourceLabel: 'Google Product Search',
        linkType: 'search',
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
        sourceUrl: 'https://www.bayercropscience.in/en/protect-crops/fungicides-en/nativo',
        sourceLabel: 'Bayer CropScience India Official Product Page',
        linkType: 'product',
        isBioOrIpm: false,
        labelInstruction:
          'Verify crop registration on the physical CIBRC label and consult your local Agriculture Officer.',
      },
    ],
  },
];

function localizeProductForLanguage(product: VerifiedProduct, language: AppLanguage): VerifiedProduct {
  if (language === 'te') {
    return {
      ...product,
      labelInstruction: product.isBioOrIpm
        ? 'IPM జీవ/సహజ నియంత్రణకు తొలి ప్రాధాన్యత ఇవ్వండి. వాడే ముందు అధికారిక లేబుల్ మరియు స్థానిక KVK / వ్యవసాయ అధికారి సూచనలు పాటించండి.'
        : 'అధికారిక CIBRC లేబుల్ సూచనలను తప్పనిసరిగా చదవండి. నిర్ధారణ మరియు మోతాదు కోసం స్థానిక KVK / వ్యవసాయ అధికారిని సంప్రదించండి.',
    };
  }
  if (language === 'hi') {
    return {
      ...product,
      labelInstruction: product.isBioOrIpm
        ? 'IPM जैव-नियंत्रण को पहली प्राथमिकता दें। उपयोग से पहले आधिकारिक लेबल और स्थानीय KVK / कृषि अधिकारी की सलाह का पालन करें।'
        : 'आधिकारिक CIBRC उत्पाद लेबल को ध्यान से पढ़ें। पुष्टि और सही मात्रा के लिए स्थानीय KVK / कृषि अधिकारी से सलाह लें।',
    };
  }
  return product;
}

export function findVerifiedProductsForDiagnosis(
  crop: string,
  issue: string,
  isUnclear: boolean,
  language: AppLanguage = 'en'
): VerifiedProduct[] {
  // Safety rule: Do not prescribe inputs for uncertain images or healthy crops.
  if (isUnclear || /^(healthy|no visible|no disease|no pest|normal)/i.test(issue.trim())) {
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
  return scored[0].products.slice(0, 3).map((p) => localizeProductForLanguage(p, language));
}
