import PDFDocument from 'pdfkit'
import type { RecoveryReport } from './buildRecoveryReport.ts'
import { join } from 'path'

type PdfColors = {
  bgTop: string
  bgBottom: string
  card: string
  cardAlt: string
  border: string
  textPrimary: string
  textMuted: string
  accent: string
  success: string
  warning: string
  danger: string
}

const C: PdfColors = {
  bgTop: '#0A1020',
  bgBottom: '#121D36',
  card: '#172540',
  cardAlt: '#1B2C4B',
  border: '#33486E',
  textPrimary: '#EAF0FF',
  textMuted: '#AAB4D6',
  accent: '#63A5FF',
  success: '#34D399',
  warning: '#F59E0B',
  danger: '#FB7185',
}

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 30
const W = PAGE_W - M * 2

const F = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
}

function safe(v: unknown): string {
  if (v == null) return '—'
  const str = String(v).trim()
  return str.length ? str : '—'
}

function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(' ')
}

function ellipsize(doc: PDFKit.PDFDocument, value: string, width: number, size: number, font = F.regular): string {
  doc.font(font).fontSize(size)
  if (doc.widthOfString(value) <= width) return value
  let out = value
  while (out.length > 0 && doc.widthOfString(`${out}…`) > width) out = out.slice(0, -1)
  return `${out}…`
}

function drawRoundedCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, alt = false) {
  doc.save()
  doc.roundedRect(x, y, w, h, 16).fill(alt ? C.cardAlt : C.card)
  doc.roundedRect(x, y, w, h, 16).lineWidth(1).strokeColor(C.border).stroke()
  doc.restore()
}

function drawMiniBrand(doc: PDFKit.PDFDocument, x: number, y: number) {
  const size = 34
  const iconPath = join(process.cwd(), 'public', 'apple-touch-icon.png')
  try {
    doc.image(iconPath, x, y, { width: size, height: size })
  } catch {
    doc.save()
    doc.roundedRect(x, y, size, size, 10).fill('#1C2A49')
    doc.circle(x + 12, y + 13, 2).fill('#DDE7FF')
    doc.circle(x + 22, y + 13, 2).fill('#DDE7FF')
    doc.restore()
  }
}

function drawStatCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  tone: 'accent' | 'success' | 'warning' | 'danger' = 'accent',
) {
  const toneColor = tone === 'success' ? C.success : tone === 'warning' ? C.warning : tone === 'danger' ? C.danger : C.accent
  doc.save()
  doc.roundedRect(x, y, w, h, 11).fill('#12203A')
  doc.roundedRect(x, y, w, h, 11).lineWidth(0.8).strokeColor('#314768').stroke()
  doc.roundedRect(x + 10, y + 10, 2.2, h - 20).fillColor(toneColor).fill()
  doc.fillColor(C.textMuted).font(F.bold).fontSize(7.4).text(label.toUpperCase(), x + 17, y + 9, { lineBreak: false })
  doc.fillColor(C.textPrimary).font(F.bold).fontSize(13.5).text(value, x + 17, y + 23, { lineBreak: false })
  doc.restore()
}

function initialsFromName(name: string) {
  const clean = name.trim()
  if (!clean) return 'GU'
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

async function loadAvatarBuffer(url?: string | null): Promise<Buffer | null> {
  if (!url) return null
  try {
    const resolvedUrl = url.startsWith('/')
      ? `http://localhost:${process.env.PORT ?? 3001}${url}`
      : url
    const response = await fetch(resolvedUrl)
    if (!response.ok) {
      return null
    }
    const bytes = await response.arrayBuffer()
    return Buffer.from(bytes)
  } catch {
    return null
  }
}

export async function generateReportPdf(report: RecoveryReport): Promise<Buffer> {
  const avatarBuffer = await loadAvatarBuffer(report.userAvatarUrl)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: { Title: 'Pebble Recovery Report', Author: 'PebbleCode' },
      autoFirstPage: true,
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('error', reject)
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    const generatedAt = new Date(report.generatedAt)
    const generatedDate = generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
    const generatedTime = generatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const outcome = safe(report.finalOutcome).toUpperCase()
    const outcomeTone: 'success' | 'warning' | 'danger' = /SUCCESS/.test(outcome)
      ? 'success'
      : /PARTIAL/.test(outcome)
        ? 'warning'
        : 'danger'
    const outcomeColor = outcomeTone === 'success' ? C.success : outcomeTone === 'warning' ? C.warning : C.danger

    const userLabel = safe(report.userName ?? report.userId)
    const userEmail = safe(report.userEmail)

    const summaryErrors = Object.entries(report.errorBreakdown ?? {})
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])

    doc.save()
    const bg = doc.linearGradient(0, 0, 0, PAGE_H)
    bg.stop(0, C.bgTop).stop(1, C.bgBottom)
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(bg)

    const glowRight = doc.radialGradient(PAGE_W - 60, 120, 40, PAGE_W - 60, 120, 300)
    glowRight.stop(0, '#2E4F82').stop(1, C.bgTop)
    doc.fillOpacity(0.2).rect(0, 0, PAGE_W, PAGE_H).fill(glowRight)

    const glowLeft = doc.radialGradient(70, 770, 30, 70, 770, 220)
    glowLeft.stop(0, '#1F3F74').stop(1, C.bgBottom)
    doc.fillOpacity(0.14).rect(0, 0, PAGE_W, PAGE_H).fill(glowLeft)
    doc.fillOpacity(1)
    doc.restore()

    // Header
    const headerY = M
    drawMiniBrand(doc, M, headerY + 2)
    doc.fillColor(C.textPrimary).font(F.bold).fontSize(27).text('Recovery Report', M + 44, headerY + 2, { lineBreak: false })
    doc.fillColor(C.textMuted).font(F.regular).fontSize(10).text(`Generated ${generatedDate} · ${generatedTime}`, M + 44, headerY + 34, { lineBreak: false })

    doc.roundedRect(PAGE_W - M - 100, headerY + 8, 100, 28, 14).fill('#112038')
    doc.roundedRect(PAGE_W - M - 100, headerY + 8, 100, 28, 14).lineWidth(1).strokeColor('#324A73').stroke()
    doc.fillColor(outcomeColor).font(F.bold).fontSize(10.5).text(outcome, PAGE_W - M - 100, headerY + 16, { width: 100, align: 'center' })

    // User + Problem rows
    const rowY = headerY + 58
    const userW = Math.floor(W * 0.44)
    const problemW = W - userW - 12
    const blockH = 106

    drawRoundedCard(doc, M, rowY, userW, blockH)
    drawRoundedCard(doc, M + userW + 12, rowY, problemW, blockH)

    const avatarX = M + 16
    const avatarY = rowY + 22
    const avatarSize = 50

    doc.save()
    doc.circle(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2).clip()
    if (avatarBuffer) {
      doc.image(avatarBuffer, avatarX, avatarY, { width: avatarSize, height: avatarSize })
    } else {
      doc.rect(avatarX, avatarY, avatarSize, avatarSize).fill('#22385E')
      doc.fillColor('#DDE7FF').font(F.bold).fontSize(18).text(initialsFromName(userLabel), avatarX, avatarY + 16, {
        width: avatarSize,
        align: 'center',
      })
    }
    doc.restore()
    doc.circle(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2).lineWidth(1).strokeColor('#3D5884').stroke()

    doc.fillColor(C.textMuted).font(F.bold).fontSize(8).text('USER', avatarX + avatarSize + 12, rowY + 18, { lineBreak: false })
    doc.fillColor(C.textPrimary).font(F.bold).fontSize(13.5).text(ellipsize(doc, userLabel, userW - 100, 13.5, F.bold), avatarX + avatarSize + 12, rowY + 32, {
      lineBreak: false,
    })
    doc.fillColor(C.textMuted).font(F.regular).fontSize(9.5).text(ellipsize(doc, userEmail, userW - 100, 9.5), avatarX + avatarSize + 12, rowY + 51, {
      lineBreak: false,
    })

    const problemTitle = safe(report.problemTitle ?? report.problemId)
    doc.fillColor(C.textMuted).font(F.bold).fontSize(8).text('PROBLEM', M + userW + 28, rowY + 18, { lineBreak: false })
    doc.fillColor(C.textPrimary).font(F.bold).fontSize(13).text(ellipsize(doc, problemTitle, problemW - 40, 13, F.bold), M + userW + 28, rowY + 32, {
      lineBreak: false,
    })

    const metaItems = [
      `ID: ${safe(report.problemId)}`,
      `Session: ${safe(report.sessionId)}`,
      `Language: ${safe(report.language)}`,
      `Difficulty: ${safe(report.difficulty)}`,
    ]
    doc.fillColor(C.textMuted).font(F.regular).fontSize(9.2)
    metaItems.forEach((item, idx) => {
      doc.text(ellipsize(doc, item, problemW - 40, 9.2), M + userW + 28, rowY + 50 + idx * 12, { lineBreak: false })
    })

    // KPI section
    const kpiY = rowY + blockH + 12
    const kpiH = 232
    drawRoundedCard(doc, M, kpiY, W, kpiH)
    doc.fillColor(C.textPrimary).font(F.bold).fontSize(13).text('Key Metrics', M + 18, kpiY + 14, { lineBreak: false })

    const statCards: Array<{ label: string; value: string; tone?: 'accent' | 'success' | 'warning' | 'danger' }> = [
      { label: 'Total Attempts', value: safe(report.totalAttempts) },
      { label: 'Runs', value: safe(report.totalRuns) },
      { label: 'Submissions', value: safe(report.totalSubmits) },
      { label: 'Avg Recovery', value: report.avgRecoveryTimeSec ? `${report.avgRecoveryTimeSec}s` : '—' },
      { label: 'Autonomy', value: `${safe(report.autonomyRate)}%`, tone: 'success' },
      { label: 'Hint Usage', value: `${safe(report.hintUsageRate)}%`, tone: 'warning' },
      { label: 'Fastest Run', value: report.fastestRunMs != null ? `${report.fastestRunMs}ms` : '—' },
      { label: 'Outcome', value: outcome, tone: outcomeTone },
    ]
    const cols = 4
    const gap = 10
    const cardW = (W - 36 - gap * (cols - 1)) / cols
    const cardH = 80
    statCards.forEach((item, idx) => {
      const row = Math.floor(idx / cols)
      const col = idx % cols
      const x = M + 18 + col * (cardW + gap)
      const y = kpiY + 36 + row * (cardH + 10)
      drawStatCard(doc, x, y, cardW, cardH, item.label, item.value, item.tone ?? 'accent')
    })

    // Bottom sections
    const bottomY = kpiY + kpiH + 12
    const leftW = Math.floor(W * 0.52)
    const rightW = W - leftW - 12
    const bottomH = 186

    drawRoundedCard(doc, M, bottomY, leftW, bottomH, true)
    drawRoundedCard(doc, M + leftW + 12, bottomY, rightW, bottomH, true)

    doc.fillColor(C.textPrimary).font(F.bold).fontSize(12.5).text('Error Breakdown', M + 18, bottomY + 14, { lineBreak: false })
    const bars = summaryErrors.length ? summaryErrors : [['no_errors', 1]]
    const maxErr = Math.max(...bars.map(([, count]) => count))
    let barY = bottomY + 40
    bars.slice(0, 5).forEach(([type, count]) => {
      const label = type === 'no_errors' ? 'No errors recorded' : humanize(type)
      const rowW = leftW - 36
      doc.fillColor(C.textMuted).font(F.regular).fontSize(9.8).text(label, M + 18, barY, { lineBreak: false })
      doc.fillColor(C.textPrimary).font(F.bold).fontSize(9.8).text(String(count), M + leftW - 30, barY, { width: 16, align: 'right', lineBreak: false })
      const y = barY + 14
      doc.roundedRect(M + 18, y, rowW, 6, 3).fill('#263A5E')
      doc.roundedRect(M + 18, y, rowW * (count / maxErr), 6, 3).fill(C.accent)
      barY += 28
    })

    doc.fillColor(C.textPrimary).font(F.bold).fontSize(12.5).text('Session Summary', M + leftW + 30, bottomY + 14, { lineBreak: false })
    const bullets = report.summaryBullets?.slice(0, 3) ?? []
    bullets.forEach((bullet, idx) => {
      const y = bottomY + 42 + idx * 40
      doc.circle(M + leftW + 34, y + 5, 2.2).fill(C.accent)
      doc.fillColor(C.textMuted).font(F.regular).fontSize(9.8).text(ellipsize(doc, bullet, rightW - 40, 9.8), M + leftW + 42, y, {
        width: rightW - 46,
        lineBreak: false,
      })
    })

    // Single footer line
    const versionLabel = process.env.npm_package_version ? ` · v${process.env.npm_package_version}` : ''
    doc.fillColor('#8EA1CC').font(F.regular).fontSize(8.6).text(`Generated by PebbleCode · Powered by AWS${versionLabel}`, 0, PAGE_H - M + 2, {
      width: PAGE_W,
      align: 'center',
      lineBreak: false,
    })

    doc.end()
  })
}
