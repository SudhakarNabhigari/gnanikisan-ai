import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import type {
  CropDoctorRecord,
  FarmDetails,
  UserLocation,
  VoiceConversation,
} from '../../src/types';

type ScriptType = 'latin' | 'telugu' | 'devanagari';

interface FontSet {
  latinRegular: string | null;
  latinBold: string | null;
  teluguRegular: string | null;
  teluguBold: string | null;
  devanagariRegular: string | null;
  devanagariBold: string | null;
}

const NOTO_DIR = '/usr/share/fonts/truetype/noto';

function findFont(candidates: string[]): string | null {
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolveFonts(): FontSet {
  return {
    latinRegular: findFont([
      path.join(NOTO_DIR, 'NotoSans-Regular.ttf'),
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]),
    latinBold: findFont([
      path.join(NOTO_DIR, 'NotoSans-Bold.ttf'),
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ]),
    teluguRegular: findFont([path.join(NOTO_DIR, 'NotoSansTelugu-Regular.ttf')]),
    teluguBold: findFont([path.join(NOTO_DIR, 'NotoSansTelugu-Bold.ttf')]),
    devanagariRegular: findFont([path.join(NOTO_DIR, 'NotoSansDevanagari-Regular.ttf')]),
    devanagariBold: findFont([path.join(NOTO_DIR, 'NotoSansDevanagari-Bold.ttf')]),
  };
}

function registerDocumentFonts(doc: PDFKit.PDFDocument, fonts: FontSet): void {
  if (fonts.latinRegular) doc.registerFont('latin', fonts.latinRegular);
  if (fonts.latinBold) doc.registerFont('latin-bold', fonts.latinBold);
  if (fonts.teluguRegular) doc.registerFont('telugu', fonts.teluguRegular);
  if (fonts.teluguBold) doc.registerFont('telugu-bold', fonts.teluguBold);
  if (fonts.devanagariRegular) doc.registerFont('devanagari', fonts.devanagariRegular);
  if (fonts.devanagariBold) doc.registerFont('devanagari-bold', fonts.devanagariBold);
}

function pickFontName(script: ScriptType, bold: boolean, fonts: FontSet): string {
  if (script === 'telugu') {
    if (bold && fonts.teluguBold) return 'telugu-bold';
    if (fonts.teluguRegular) return 'telugu';
  }
  if (script === 'devanagari') {
    if (bold && fonts.devanagariBold) return 'devanagari-bold';
    if (fonts.devanagariRegular) return 'devanagari';
  }
  if (bold && fonts.latinBold) return 'latin-bold';
  if (fonts.latinRegular) return 'latin';
  return bold ? 'Helvetica-Bold' : 'Helvetica';
}

function sanitizePdfText(raw: string): string {
  // Remove surrogate-pair emoji symbols that lack glyphs in standard Noto Sans TTF fonts
  return String(raw ?? '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
}

function splitRunsByScript(line: string): Array<{ script: ScriptType; text: string }> {
  const runs: Array<{ script: ScriptType; text: string }> = [];
  let currentScript: ScriptType | null = null;
  let buffer = '';

  for (const ch of line) {
    const code = ch.codePointAt(0) ?? 0;
    let nextScript: ScriptType;
    if (code >= 0x0c00 && code <= 0x0c7f) {
      nextScript = 'telugu';
    } else if (code >= 0x0900 && code <= 0x097f) {
      nextScript = 'devanagari';
    } else if (ch === ' ' || ch === '\t') {
      // Keep whitespace attached to the active Indic/Latin run for clean word spacing
      nextScript = currentScript ?? 'latin';
    } else {
      nextScript = 'latin';
    }

    if (currentScript === null) {
      currentScript = nextScript;
      buffer = ch;
    } else if (currentScript === nextScript) {
      buffer += ch;
    } else {
      runs.push({ script: currentScript, text: buffer });
      currentScript = nextScript;
      buffer = ch;
    }
  }

  if (buffer && currentScript) {
    runs.push({ script: currentScript, text: buffer });
  }
  return runs;
}

function writeUnicodeParagraph(
  doc: PDFKit.PDFDocument,
  fonts: FontSet,
  rawText: string,
  options: {
    fontSize?: number;
    bold?: boolean;
    color?: string;
    lineGap?: number;
    paragraphGap?: number;
    width?: number;
    indent?: number;
  } = {}
): void {
  const text = sanitizePdfText(rawText);
  if (!text) return;

  const fontSize = options.fontSize ?? 10.5;
  const bold = Boolean(options.bold);
  const color = options.color ?? '#0D2315';
  const lineGap = options.lineGap ?? 3;
  const width = options.width ?? 495;
  const indent = options.indent ?? 0;

  doc.fontSize(fontSize).fillColor(color);

  const lines = text.split(/\r?\n/);
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx += 1) {
    const line = lines[lineIdx];
    if (!line.trim()) {
      doc.moveDown(0.35);
      continue;
    }

    const runs = splitRunsByScript(line);
    if (runs.length === 0) continue;

    for (let i = 0; i < runs.length; i += 1) {
      const run = runs[i];
      const isLast = i === runs.length - 1;
      doc.font(pickFontName(run.script, bold, fonts));
      if (i === 0 && indent > 0) {
        doc.text(run.text, doc.page.margins.left + indent, doc.y, {
          width: width - indent,
          lineGap,
          continued: !isLast,
        });
      } else {
        doc.text(run.text, {
          width: width - indent,
          lineGap,
          continued: !isLast,
        });
      }
    }
  }

  if (options.paragraphGap) {
    doc.moveDown(options.paragraphGap);
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, minRemaining = 90): void {
  const bottomLimit = doc.page.height - doc.page.margins.bottom - minRemaining;
  if (doc.y > bottomLimit) {
    doc.addPage();
  }
}

export function slugifyFilename(input: string, fallback = 'record'): string {
  const cleaned = String(input ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || fallback;
}

export function audioExtFromMime(mime?: string): string {
  const m = String(mime || '').toLowerCase();
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('ogg')) return 'ogg';
  if (m.includes('webm')) return 'webm';
  return 'wav';
}

export function buildTurnAudioFilename(params: {
  prefix: 'voice' | 'crop-doctor';
  createdAt: string;
  turnNumber: number;
  language?: string;
  audioMime?: string;
}): string {
  const datePart = (params.createdAt || new Date().toISOString()).slice(0, 10);
  const langPart = params.language ? `-${params.language}` : '';
  const ext = audioExtFromMime(params.audioMime);
  return `gnanikisan-${params.prefix}-${datePart}-resp-${params.turnNumber}${langPart}.${ext}`;
}

export function decodeDataUrlImage(dataUrl: string): { buffer: Buffer; ext: string; mime: string } | null {
  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i.exec(String(dataUrl || ''));
  if (!match) return null;
  const rawMime = match[1].toLowerCase();
  const mime = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return {
    buffer: Buffer.from(match[2], 'base64'),
    ext,
    mime,
  };
}

function formatLanguageDisplay(lang: string): string {
  if (lang === 'te') return 'Telugu (TE)';
  if (lang === 'hi') return 'Hindi (HI)';
  return 'English (EN)';
}

function collectVoiceLanguages(conv: VoiceConversation): string {
  const langs = Array.from(new Set([conv.language, ...conv.turns.map((t) => t.language)]));
  return langs.map(formatLanguageDisplay).join(', ');
}

export function formatVoiceConversationPlainText(
  conv: VoiceConversation,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): string {
  const lines: string[] = [
    'GNANIKISAN AI - VOICE ASSISTANT CONVERSATION',
    '==================================================',
    `Title: ${conv.title}`,
    `Farmer Account: ${username}`,
    `Location: ${location?.name || 'Not set'}`,
    `Farm Details: ${farm.landArea || 0} ${farm.landUnit} | Crops: ${farm.crops.join(', ') || 'None'} | Soil: ${farm.soilType} | Irrigation: ${farm.irrigation}`,
    `Languages Used: ${collectVoiceLanguages(conv)}`,
    `Started: ${new Date(conv.createdAt).toLocaleString('en-IN')}`,
    `Last Updated: ${new Date(conv.updatedAt).toLocaleString('en-IN')}`,
    `Duration: ${conv.durationSec}s`,
    `Total Turns: ${conv.turns.length}`,
    '',
    'CONVERSATION TRANSCRIPT',
    '--------------------------------------------------',
  ];

  conv.turns.forEach((turn, idx) => {
    const who = turn.role === 'user' ? 'Farmer' : 'GnaniKisan AI';
    const time = new Date(turn.timestamp).toLocaleString('en-IN');
    lines.push(`[#${idx + 1}] ${who} (${formatLanguageDisplay(turn.language)}) — ${time}`);
    lines.push(turn.text);
    lines.push('');
  });

  return lines.join('\n');
}

export function formatCropDoctorPlainText(
  rec: CropDoctorRecord,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): string {
  const lines: string[] = [
    'GNANIKISAN AI - CROP DOCTOR AI REPORT',
    '==================================================',
    `Crop & Finding: ${rec.cropName} — ${rec.analysis.possibleIssue}`,
    `Farmer Account: ${username}`,
    `Location: ${rec.location || location?.name || 'Not set'}`,
    `Growth Stage: ${rec.growthStage || farm.growthStage || 'Not specified'}`,
    `Farm Details: ${farm.landArea || 0} ${farm.landUnit} | Crops: ${farm.crops.join(', ') || 'None'} | Soil: ${farm.soilType} | Irrigation: ${farm.irrigation}`,
    `Severity Assessment: ${rec.analysis.severity}`,
    `Created: ${new Date(rec.createdAt).toLocaleString('en-IN')}`,
    `Last Updated: ${new Date(rec.updatedAt).toLocaleString('en-IN')}`,
    '',
    'VISUAL INSPECTION SUMMARY',
    '--------------------------------------------------',
    `Symptoms: ${rec.analysis.symptomsSummary}`,
    `Explanation: ${rec.analysis.explanation}`,
    `Confidence Note: ${rec.analysis.confidenceNote}`,
    `IPM Guidance: ${rec.analysis.ipmGuidance}`,
    '',
    'Care Tips:',
    ...(rec.analysis.careTips.length > 0 ? rec.analysis.careTips.map((tip, i) => `  ${i + 1}. ${tip}`) : ['  None']),
    '',
    'Prevention Tips:',
    ...(rec.analysis.preventionTips.length > 0
      ? rec.analysis.preventionTips.map((tip, i) => `  ${i + 1}. ${tip}`)
      : ['  None']),
    '',
    'CONVERSATION HISTORY',
    '--------------------------------------------------',
  ];

  rec.turns.forEach((turn, idx) => {
    const who = turn.role === 'user' ? 'Farmer' : 'GnaniCrop Doctor AI';
    const time = new Date(turn.timestamp).toLocaleString('en-IN');
    lines.push(`[#${idx + 1}] ${who} — ${time}`);
    lines.push(turn.text);
    lines.push('');
  });

  lines.push(`Advisory Disclaimer: ${rec.analysis.disclaimer}`);
  return lines.join('\n');
}

function collectPdfBuffer(buildFn: (doc: PDFKit.PDFDocument, fonts: FontSet) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const fonts = resolveFonts();
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, bottom: 52, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: 'GnaniKisan AI History Export',
        Author: 'GnaniKisan AI',
      },
    });
    registerDocumentFonts(doc, fonts);

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      buildFn(doc, fonts);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateVoicePdfBuffer(
  conv: VoiceConversation,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<Buffer> {
  return collectPdfBuffer((doc, fonts) => {
    // Header Banner
    doc.rect(50, 44, 495, 48).fill('#0E4424');
    doc.fillColor('#FFFFFF').font(pickFontName('latin', true, fonts)).fontSize(15);
    doc.text('GnaniKisan AI — Voice Assistant Transcript', 64, 57, { width: 465 });
    doc.font(pickFontName('latin', false, fonts)).fontSize(9).fillColor('#BBF7D0');
    doc.text(`Exported ${new Date().toLocaleString('en-IN')}`, 64, 76, { width: 465 });

    doc.x = 50;
    doc.y = 108;

    writeUnicodeParagraph(doc, fonts, conv.title, {
      fontSize: 14,
      bold: true,
      color: '#0D2315',
      paragraphGap: 0.3,
    });

    const metaLines = [
      `Farmer: ${username}  |  Location: ${location?.name || 'Not set'}`,
      `Date & Time: ${new Date(conv.createdAt).toLocaleString('en-IN')} (Updated: ${new Date(conv.updatedAt).toLocaleString('en-IN')})`,
      `Languages: ${collectVoiceLanguages(conv)}  |  Duration: ${conv.durationSec}s  |  Turns: ${conv.turns.length}`,
      `Farm Profile: ${farm.landArea || 0} ${farm.landUnit} · Crops: ${farm.crops.join(', ') || 'None'} · Soil: ${farm.soilType} · Irrigation: ${farm.irrigation}`,
    ];
    for (const ml of metaLines) {
      writeUnicodeParagraph(doc, fonts, ml, {
        fontSize: 9.5,
        color: '#334155',
        lineGap: 2,
      });
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
    doc.moveDown(0.6);

    conv.turns.forEach((turn, idx) => {
      ensureSpace(doc, 95);
      const speaker = turn.role === 'user' ? 'Farmer' : 'GnaniKisan AI';
      const timeStr = new Date(turn.timestamp).toLocaleString('en-IN');
      const header = `#${idx + 1}  ${speaker}  [${formatLanguageDisplay(turn.language)}]  •  ${timeStr}`;

      writeUnicodeParagraph(doc, fonts, header, {
        fontSize: 9.5,
        bold: true,
        color: turn.role === 'user' ? '#15803D' : '#1E3A8A',
        lineGap: 2,
      });

      writeUnicodeParagraph(doc, fonts, turn.text, {
        fontSize: 10.5,
        color: '#0F172A',
        lineGap: 3,
        indent: 8,
        paragraphGap: 0.5,
      });
    });
  });
}

export async function generateCropDoctorPdfBuffer(
  rec: CropDoctorRecord,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<Buffer> {
  return collectPdfBuffer((doc, fonts) => {
    doc.rect(50, 44, 495, 48).fill('#0E4424');
    doc.fillColor('#FFFFFF').font(pickFontName('latin', true, fonts)).fontSize(15);
    doc.text('GnaniKisan AI — Crop Doctor Inspection Report', 64, 57, { width: 465 });
    doc.font(pickFontName('latin', false, fonts)).fontSize(9).fillColor('#BBF7D0');
    doc.text(`Exported ${new Date().toLocaleString('en-IN')}`, 64, 76, { width: 465 });

    doc.x = 50;
    doc.y = 108;

    writeUnicodeParagraph(doc, fonts, `${rec.cropName} — ${rec.analysis.possibleIssue}`, {
      fontSize: 14,
      bold: true,
      color: '#0D2315',
      paragraphGap: 0.3,
    });

    const metaLines = [
      `Farmer: ${username}  |  Location: ${rec.location || location?.name || 'Not set'}`,
      `Date & Time: ${new Date(rec.createdAt).toLocaleString('en-IN')} (Updated: ${new Date(rec.updatedAt).toLocaleString('en-IN')})`,
      `Growth Stage: ${rec.growthStage || farm.growthStage || 'Not specified'}  |  Severity: ${rec.analysis.severity}`,
      `Farm Profile: ${farm.landArea || 0} ${farm.landUnit} · Crops: ${farm.crops.join(', ') || 'None'} · Soil: ${farm.soilType}`,
    ];
    for (const ml of metaLines) {
      writeUnicodeParagraph(doc, fonts, ml, {
        fontSize: 9.5,
        color: '#334155',
        lineGap: 2,
      });
    }

    const decodedImage = decodeDataUrlImage(rec.imageDataUrl);
    if (decodedImage) {
      try {
        doc.moveDown(0.5);
        ensureSpace(doc, 165);
        const startY = doc.y;
        doc.image(decodedImage.buffer, 50, startY, { fit: [210, 145] });
        doc.y = startY + 155;
      } catch {
        // Ignore non-standard image payload if PDFKit cannot embed it
      }
    }

    doc.moveDown(0.4);
    writeUnicodeParagraph(doc, fonts, 'Symptoms & Visual Explanation', {
      fontSize: 11,
      bold: true,
      color: '#15803D',
    });
    writeUnicodeParagraph(doc, fonts, `${rec.analysis.symptomsSummary}\n${rec.analysis.explanation}`, {
      fontSize: 10,
      color: '#0F172A',
      paragraphGap: 0.35,
    });

    if (rec.analysis.careTips.length > 0) {
      ensureSpace(doc, 70);
      writeUnicodeParagraph(doc, fonts, 'Care Tips', {
        fontSize: 10.5,
        bold: true,
        color: '#15803D',
      });
      rec.analysis.careTips.forEach((tip, i) => {
        writeUnicodeParagraph(doc, fonts, `${i + 1}. ${tip}`, {
          fontSize: 9.5,
          indent: 8,
        });
      });
      doc.moveDown(0.3);
    }

    if (rec.analysis.preventionTips.length > 0) {
      ensureSpace(doc, 70);
      writeUnicodeParagraph(doc, fonts, 'Prevention Tips', {
        fontSize: 10.5,
        bold: true,
        color: '#B45309',
      });
      rec.analysis.preventionTips.forEach((tip, i) => {
        writeUnicodeParagraph(doc, fonts, `${i + 1}. ${tip}`, {
          fontSize: 9.5,
          indent: 8,
        });
      });
      doc.moveDown(0.3);
    }

    ensureSpace(doc, 80);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
    doc.moveDown(0.5);

    writeUnicodeParagraph(doc, fonts, 'Consultation Thread', {
      fontSize: 11,
      bold: true,
      color: '#0D2315',
      paragraphGap: 0.3,
    });

    rec.turns.forEach((turn, idx) => {
      ensureSpace(doc, 85);
      const speaker = turn.role === 'user' ? 'Farmer' : 'GnaniCrop Doctor AI';
      const timeStr = new Date(turn.timestamp).toLocaleString('en-IN');
      writeUnicodeParagraph(doc, fonts, `#${idx + 1}  ${speaker}  •  ${timeStr}`, {
        fontSize: 9.5,
        bold: true,
        color: turn.role === 'user' ? '#15803D' : '#1E3A8A',
      });
      writeUnicodeParagraph(doc, fonts, turn.text, {
        fontSize: 10,
        indent: 8,
        paragraphGap: 0.45,
      });
    });

    ensureSpace(doc, 60);
    writeUnicodeParagraph(doc, fonts, `Advisory Note: ${rec.analysis.disclaimer}`, {
      fontSize: 8.5,
      color: '#475569',
    });
  });
}

async function addVoiceConversationToZipFolder(
  folder: JSZip,
  conv: VoiceConversation,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<void> {
  const pdfBuf = await generateVoicePdfBuffer(conv, farm, location, username);
  const txtContent = formatVoiceConversationPlainText(conv, farm, location, username);

  folder.file('conversation.pdf', pdfBuf);
  folder.file('conversation.txt', txtContent);

  const audioFiles: Array<{ turnNumber: number; filename: string; mime: string; language: string; provider?: string }> = [];
  let responseCount = 0;
  for (const turn of conv.turns) {
    if (turn.role === 'assistant') {
      responseCount += 1;
      if (turn.audioBase64) {
        const filename = buildTurnAudioFilename({
          prefix: 'voice',
          createdAt: turn.timestamp || conv.createdAt,
          turnNumber: responseCount,
          language: turn.language,
          audioMime: turn.audioMime,
        });
        folder.file(`audio/${filename}`, Buffer.from(turn.audioBase64, 'base64'));
        audioFiles.push({
          turnNumber: responseCount,
          filename: `audio/${filename}`,
          mime: turn.audioMime || 'audio/wav',
          language: turn.language,
          provider: turn.ttsProvider,
        });
      }
    }
  }

  folder.file(
    'metadata.json',
    JSON.stringify(
      {
        id: conv.id,
        category: 'voice-assistant',
        title: conv.title,
        primaryLanguage: conv.language,
        languagesUsed: Array.from(new Set(conv.turns.map((t) => t.language))),
        durationSec: conv.durationSec,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        turnCount: conv.turns.length,
        audioFiles,
        farmContext: {
          location: location?.name || null,
          crops: farm.crops,
          landArea: farm.landArea,
          landUnit: farm.landUnit,
        },
      },
      null,
      2
    )
  );
}

async function addCropDoctorToZipFolder(
  folder: JSZip,
  rec: CropDoctorRecord,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<void> {
  const pdfBuf = await generateCropDoctorPdfBuffer(rec, farm, location, username);
  const txtContent = formatCropDoctorPlainText(rec, farm, location, username);

  folder.file('report.pdf', pdfBuf);
  folder.file('report.txt', txtContent);

  let imageFilename: string | null = null;
  const img = decodeDataUrlImage(rec.imageDataUrl);
  if (img) {
    imageFilename = `crop-image.${img.ext}`;
    folder.file(imageFilename, img.buffer);
  }

  const audioFiles: Array<{ turnNumber: number; filename: string; mime: string; provider?: string }> = [];
  let responseCount = 0;
  for (const turn of rec.turns) {
    if (turn.role === 'assistant') {
      responseCount += 1;
      if (turn.audioBase64) {
        const filename = buildTurnAudioFilename({
          prefix: 'crop-doctor',
          createdAt: turn.timestamp || rec.createdAt,
          turnNumber: responseCount,
          audioMime: turn.audioMime,
        });
        folder.file(`audio/${filename}`, Buffer.from(turn.audioBase64, 'base64'));
        audioFiles.push({
          turnNumber: responseCount,
          filename: `audio/${filename}`,
          mime: turn.audioMime || 'audio/wav',
          provider: turn.ttsProvider,
        });
      }
    }
  }

  folder.file(
    'metadata.json',
    JSON.stringify(
      {
        id: rec.id,
        category: 'crop-doctor',
        cropName: rec.cropName,
        possibleIssue: rec.analysis.possibleIssue,
        severity: rec.analysis.severity,
        location: rec.location || location?.name || null,
        growthStage: rec.growthStage || null,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
        turnCount: rec.turns.length,
        imageFilename,
        audioFiles,
      },
      null,
      2
    )
  );
}

export async function generateVoiceConversationZip(
  conv: VoiceConversation,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<Buffer> {
  const zip = new JSZip();
  await addVoiceConversationToZipFolder(zip, conv, farm, location, username);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function generateCropDoctorZip(
  rec: CropDoctorRecord,
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<Buffer> {
  const zip = new JSZip();
  await addCropDoctorToZipFolder(zip, rec, farm, location, username);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function generateAllHistoryZip(
  voiceHistory: VoiceConversation[],
  cropHistory: CropDoctorRecord[],
  farm: FarmDetails,
  location: UserLocation | null,
  username: string
): Promise<Buffer> {
  const zip = new JSZip();

  const indexEntries: Array<{
    category: 'Voice Assistant' | 'Crop Doctor AI';
    id: string;
    title: string;
    date: string;
    folder: string;
  }> = [];

  for (let i = 0; i < voiceHistory.length; i += 1) {
    const conv = voiceHistory[i];
    const datePart = (conv.updatedAt || conv.createdAt).slice(0, 10);
    const folderName = `${datePart}_${String(i + 1).padStart(2, '0')}_${slugifyFilename(conv.title, 'voice')}`;
    const folder = zip.folder(`voice-assistant/${folderName}`)!;
    await addVoiceConversationToZipFolder(folder, conv, farm, location, username);
    indexEntries.push({
      category: 'Voice Assistant',
      id: conv.id,
      title: conv.title,
      date: conv.updatedAt,
      folder: `voice-assistant/${folderName}`,
    });
  }

  for (let i = 0; i < cropHistory.length; i += 1) {
    const rec = cropHistory[i];
    const datePart = (rec.updatedAt || rec.createdAt).slice(0, 10);
    const title = `${rec.cropName} - ${rec.analysis.possibleIssue}`;
    const folderName = `${datePart}_${String(i + 1).padStart(2, '0')}_${slugifyFilename(rec.cropName, 'crop')}`;
    const folder = zip.folder(`crop-doctor/${folderName}`)!;
    await addCropDoctorToZipFolder(folder, rec, farm, location, username);
    indexEntries.push({
      category: 'Crop Doctor AI',
      id: rec.id,
      title,
      date: rec.updatedAt,
      folder: `crop-doctor/${folderName}`,
    });
  }

  const summaryLines = [
    'GNANIKISAN AI — COMPLETE HISTORY ARCHIVE INDEX',
    '==================================================',
    `Farmer Account: ${username}`,
    `Location: ${location?.name || 'Not set'}`,
    `Exported At: ${new Date().toLocaleString('en-IN')}`,
    `Voice Assistant Conversations: ${voiceHistory.length}`,
    `Crop Doctor Analyses: ${cropHistory.length}`,
    '',
    'RECORDS BY CATEGORY & DATE',
    '--------------------------------------------------',
    ...indexEntries.map(
      (item, i) =>
        `${i + 1}. [${item.category}] ${new Date(item.date).toLocaleString('en-IN')} | ${item.title} -> ${item.folder}`
    ),
  ];

  zip.file('index.txt', summaryLines.join('\n'));
  zip.file(
    'index.json',
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        username,
        location: location?.name || null,
        counts: {
          voiceAssistant: voiceHistory.length,
          cropDoctor: cropHistory.length,
        },
        records: indexEntries,
      },
      null,
      2
    )
  );

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
