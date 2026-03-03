import PDFDocument from "pdfkit"
import type { RecoveryReport } from "./buildRecoveryReport.ts"
import { join } from "path"

/**
 * Pebble Recovery Report — single-page A4, content-measured layout.
 * No hardcoded card heights; every section sizes itself to its content.
 */
export async function generateReportPdf(report: RecoveryReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 0,
            info: { Title: "Pebble Recovery Report", Author: "Pebble" },
        })

        const chunks: Buffer[] = []
        doc.on("data", (c: Buffer) => chunks.push(c))
        doc.on("end", () => resolve(Buffer.concat(chunks)))
        doc.on("error", reject)

        // ── Design tokens ─────────────────────────────────────────────────────────
        const C = {
            primary: "#243B67",
            accent:  "#3B82F6",
            ink:     "#0B1220",
            muted:   "#64748B",
            border:  "#E5E7EB",
            bg:      "#FFFFFF",
            success: "#16A34A",
            danger:  "#EF4444",
        }
        const F = {
            bold:    "Helvetica-Bold",
            regular: "Helvetica",
            italic:  "Helvetica-Oblique",
        }

        const PAGE_W = 595.28
        const PAGE_H = 841.89
        const M  = 40
        const CW = PAGE_W - M * 2   // 515.28

        // ── Text helpers ──────────────────────────────────────────────────────────

        const safe = (v: any): string =>
            v == null || String(v).trim() === "" ? "—" : String(v)

        const humanize = (s: string) =>
            s.replace(/_/g, " ")
             .split(" ")
             .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
             .join(" ")

        /** Estimated single-line height for Helvetica at a given size. */
        const lh = (size: number) => size * 1.2

        /** Clip single-line text to maxW with trailing ellipsis. */
        function ellipsize(text: string, maxW: number, font: string, size: number): string {
            doc.font(font).fontSize(size)
            if (doc.widthOfString(text) <= maxW) return text
            let s = text
            while (s.length > 0 && doc.widthOfString(s.trimEnd() + "…") > maxW) {
                s = s.slice(0, -1)
            }
            return s.trimEnd() + "…"
        }

        // ── Draw primitives ───────────────────────────────────────────────────────

        function drawCard(x: number, y: number, w: number, h: number, r = 14) {
            doc.save()
            doc.roundedRect(x + 1, y + 2, w, h, r).fill("#00000006")  // subtle shadow
            doc.roundedRect(x, y, w, h, r).fill(C.bg)
            doc.roundedRect(x, y, w, h, r).lineWidth(0.8).stroke(C.border)
            doc.restore()
        }

        /** Draw a status pill and return its width. */
        function drawPill(x: number, y: number, text: string, color: string): number {
            doc.font(F.bold).fontSize(9)
            const tw = doc.widthOfString(text)
            const pw = tw + 24
            const ph = 22
            doc.save()
            doc.roundedRect(x, y, pw, ph, ph / 2).fill(color + "18")
            doc.fillColor(color).text(text, x + 12, y + 6.5, { lineBreak: false })
            doc.restore()
            return pw
        }

        /** Fallback pebble-shaped logo drawn in vectors. */
        function drawFallbackLogo(x: number, y: number, size: number) {
            doc.save()
            doc.fillColor(C.primary)
            doc.roundedRect(x, y, size, size * 0.85, size * 0.45).fill()
            doc.fillColor("#FFFFFF")
            const r = size * 0.08
            doc.circle(x + size * 0.35, y + size * 0.35, r).fill()
            doc.circle(x + size * 0.65, y + size * 0.35, r).fill()
            doc.restore()
        }

        // ── Report data prep ──────────────────────────────────────────────────────

        const outcome = safe(report.finalOutcome).toUpperCase()
        const isSuccess = /SUCCESS|ACCEPTED/.test(outcome)
        const isDanger  = /FAIL|ERROR|INCOMPLETE/.test(outcome)
        const outcomeColor = isSuccess ? C.success : isDanger ? C.danger : C.accent

        const metrics: [string, string, string | null][] = [
            ["Total Attempts", safe(report.totalAttempts),                                              null],
            ["Runs Executed",  safe(report.totalRuns),                                                  null],
            ["Submissions",    safe(report.totalSubmits),                                               null],
            ["Avg Recovery",   report.avgRecoveryTimeSec ? `${report.avgRecoveryTimeSec}s` : "—",      null],
            ["Autonomy Rate",  `${report.autonomyRate}%`,                                               C.success],
            ["Hint Usage",     `${report.hintUsageRate}%`,                                              C.danger],
            ["Fastest Run",    report.fastestRunMs != null ? `${report.fastestRunMs}ms` : "—",          null],
        ]

        const errorItems = Object.entries(report.errorBreakdown ?? {})
            .filter(([, c]) => c > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)

        const topErr = errorItems[0]?.[0] ?? "logical"
        const suggestions = [
            `Audit ${humanize(topErr)} edge cases in your code.`,
            "Reduce reliance on guidance for Tier 2 submissions.",
            isSuccess
                ? "Optimize runtime performance on successful paths."
                : "Focus on debugging the most frequent error before retrying.",
        ]

        // ── Layout constants ──────────────────────────────────────────────────────

        const PAD_X        = 20    // horizontal inset within cards
        const PAD_T        = 24    // card top padding
        const PAD_B        = 20    // card bottom padding
        const TITLE_SZ     = 13    // section heading font size
        const TITLE_H      = lh(TITLE_SZ)
        const AFTER_TITLE  = 14    // gap from title baseline to first content item

        // Column widths: 58 % left, rest right, 20 pt gap
        const LEFT_W  = Math.round(CW * 0.58)   // ~299 pt
        const COL_GAP = 20
        const RIGHT_W = CW - LEFT_W - COL_GAP    // ~196 pt

        // ── Height measurement: Key Metrics card ──────────────────────────────────

        const TILE_LABEL_SZ  = 9
        const TILE_VALUE_SZ  = 14
        const TILE_VALUE_OFF = 14   // value positioned 14 pt below tile top
        const TILE_H         = TILE_VALUE_OFF + lh(TILE_VALUE_SZ)   // ~30.8 pt
        const TILE_ROW_GAP   = 14

        const METRIC_ROWS   = Math.ceil(metrics.length / 2)
        const metricsGridH  = METRIC_ROWS * TILE_H + (METRIC_ROWS - 1) * TILE_ROW_GAP
        const LEFT_CARD_H   = PAD_T + TITLE_H + AFTER_TITLE + metricsGridH + PAD_B

        // ── Height measurement: Error Breakdown card ──────────────────────────────

        const ERR_SZ         = 9.5
        const ERR_LABEL_H    = lh(ERR_SZ)
        const ERR_BAR_H      = 2.5
        const ERR_BAR_OFF    = ERR_LABEL_H + 2     // bar sits 2 pt below label
        const ERR_ROW_STRIDE = ERR_BAR_OFF + ERR_BAR_H + 10   // +10 gap to next row

        const errContentH  = errorItems.length > 0
            ? errorItems.length * ERR_ROW_STRIDE - 10   // drop trailing gap
            : lh(10.5) + 4                               // "No errors" line
        const BREAKDOWN_H  = PAD_T + TITLE_H + AFTER_TITLE + errContentH + PAD_B

        // ── Height measurement: Next Actions card ─────────────────────────────────

        const ACT_SZ       = 9.8
        const ACT_LINE_GAP = 2
        const ACT_ITEM_GAP = 10
        const actTextW     = RIGHT_W - PAD_X - 14   // text column after bullet indent

        doc.font(F.regular).fontSize(ACT_SZ)
        const actItemHeights = suggestions.map(s =>
            doc.heightOfString(s, { width: actTextW, lineGap: ACT_LINE_GAP })
        )
        const actContentH = actItemHeights.reduce(
            (sum, h, i) => sum + h + (i < suggestions.length - 1 ? ACT_ITEM_GAP : 0),
            0,
        )
        const ACTIONS_H = PAD_T + TITLE_H + AFTER_TITLE + actContentH + PAD_B

        // ── Bento height: tallest column wins ─────────────────────────────────────

        const BENTO_COL_GAP = 16
        const rightColH     = BREAKDOWN_H + BENTO_COL_GAP + ACTIONS_H
        const rawBentoH     = Math.max(LEFT_CARD_H, rightColH)

        // Single-page safety: never let content push past page bottom
        const HEADER_H    = 66
        const STRIP_H     = 68
        const STRIP_GAP   = 20
        const FOOTER_RES  = 32
        const available   = PAGE_H - M * 2 - HEADER_H - STRIP_H - STRIP_GAP * 2 - FOOTER_RES
        const BENTO_H     = Math.min(rawBentoH, available)

        // ─────────────────────────────────────────────────────────────────────────
        // Drawing
        // ─────────────────────────────────────────────────────────────────────────

        let y = M

        // ── 1. Header ─────────────────────────────────────────────────────────────

        const LOGO_SZ = 34
        try {
            doc.image(
                join(process.cwd(), "public", "branding", "pebble-light-dot.png"),
                M, y, { height: LOGO_SZ },
            )
        } catch {
            drawFallbackLogo(M, y, LOGO_SZ)
        }

        const hdX = M + LOGO_SZ + 14
        doc.fillColor(C.primary).font(F.bold).fontSize(20)
            .text("Pebble Recovery Report", hdX, y + 1, { lineBreak: false })

        doc.fillColor(C.muted).font(F.regular).fontSize(9.5)
            .text(
                `Generated • ${new Date(report.generatedAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                })}`,
                hdX, y + 22, { lineBreak: false },
            )

        // Outcome pill, right-aligned
        doc.font(F.bold).fontSize(9)
        const pillW = doc.widthOfString(outcome) + 24
        drawPill(PAGE_W - M - pillW, y + 7, outcome, outcomeColor)

        y += HEADER_H

        // ── 2. Identity strip ─────────────────────────────────────────────────────

        drawCard(M, y, CW, STRIP_H)

        const idItems: [string, string][] = [
            ["Problem ID", report.problemId],
            ["Session ID", report.sessionId],
            ["User ID",    report.userId],
            ["Outcome",    outcome],
        ]
        const idColW = CW / 4
        idItems.forEach(([label, value], i) => {
            const cx = M + i * idColW + PAD_X
            doc.fillColor(C.muted).font(F.bold).fontSize(8.5)
                .text(label.toUpperCase(), cx, y + 16, { lineBreak: false })
            doc.fillColor(C.ink).font(F.bold).fontSize(10.5)
                .text(ellipsize(safe(value), idColW - 32, F.bold, 10.5), cx, y + 34, { lineBreak: false })
        })

        y += STRIP_H + STRIP_GAP

        const bentoY  = y
        const rightX  = M + LEFT_W + COL_GAP

        // ── 3. Key Metrics (left card) ────────────────────────────────────────────

        drawCard(M, bentoY, LEFT_W, BENTO_H)
        doc.fillColor(C.ink).font(F.bold).fontSize(TITLE_SZ)
            .text("Key Metrics", M + PAD_X, bentoY + PAD_T, { lineBreak: false })

        const tileColW   = (LEFT_W - PAD_X * 2 - 20) / 2   // two columns, 20 pt gap
        const tileStartY = bentoY + PAD_T + TITLE_H + AFTER_TITLE
        const accentBarH = Math.round(TILE_H * 0.55)

        metrics.forEach(([label, value, accentCol], i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            const tx  = M + PAD_X + col * (tileColW + 20)
            const ty  = tileStartY + row * (TILE_H + TILE_ROW_GAP)

            // Accent marker bar
            doc.save()
            doc.moveTo(tx, ty + 2).lineTo(tx, ty + 2 + accentBarH)
                .lineWidth(2)
                .strokeColor((accentCol ?? C.accent) + "55")
                .stroke()
            doc.restore()

            doc.fillColor(C.muted).font(F.regular).fontSize(TILE_LABEL_SZ)
                .text(label, tx + 8, ty, { lineBreak: false })
            doc.fillColor(C.ink).font(F.bold).fontSize(TILE_VALUE_SZ)
                .text(value, tx + 8, ty + TILE_VALUE_OFF, { lineBreak: false })
        })

        // ── 4. Error Breakdown (right top card) ───────────────────────────────────

        drawCard(rightX, bentoY, RIGHT_W, BREAKDOWN_H)
        doc.fillColor(C.ink).font(F.bold).fontSize(TITLE_SZ)
            .text("Error Breakdown", rightX + PAD_X, bentoY + PAD_T, { lineBreak: false })

        const barW = RIGHT_W - PAD_X * 2
        let eY = bentoY + PAD_T + TITLE_H + AFTER_TITLE

        if (errorItems.length === 0) {
            doc.fillColor(C.muted).font(F.italic).fontSize(10.5)
                .text("No errors recorded this session.", rightX + PAD_X, eY, { lineBreak: false })
        } else {
            const maxCount = Math.max(...errorItems.map(([, c]) => c))
            errorItems.forEach(([type, count]) => {
                const lbl    = ellipsize(humanize(type), barW - 30, F.regular, ERR_SZ)
                const cntStr = String(count)

                doc.fillColor(C.muted).font(F.regular).fontSize(ERR_SZ)
                    .text(lbl, rightX + PAD_X, eY, { lineBreak: false })
                doc.fillColor(C.ink).font(F.bold).fontSize(ERR_SZ)
                    .text(cntStr, rightX + RIGHT_W - PAD_X - doc.widthOfString(cntStr), eY, { lineBreak: false })

                const bY = eY + ERR_BAR_OFF
                doc.save()
                doc.rect(rightX + PAD_X, bY, barW, ERR_BAR_H).fill(C.border)
                doc.rect(rightX + PAD_X, bY, barW * (count / maxCount), ERR_BAR_H).fill(C.accent + "70")
                doc.restore()

                eY += ERR_ROW_STRIDE
            })
        }

        // ── 5. Next Actions (right bottom card) ───────────────────────────────────

        const actionsY = bentoY + BREAKDOWN_H + BENTO_COL_GAP
        drawCard(rightX, actionsY, RIGHT_W, ACTIONS_H)
        doc.fillColor(C.ink).font(F.bold).fontSize(TITLE_SZ)
            .text("Next Actions", rightX + PAD_X, actionsY + PAD_T, { lineBreak: false })

        let aY = actionsY + PAD_T + TITLE_H + AFTER_TITLE
        suggestions.forEach((s, i) => {
            doc.fillColor(C.accent).font(F.bold).fontSize(11)
                .text("›", rightX + PAD_X, aY, { lineBreak: false })
            doc.fillColor(C.muted).font(F.regular).fontSize(ACT_SZ)
                .text(s, rightX + PAD_X + 14, aY, { width: actTextW, lineGap: ACT_LINE_GAP })
            aY += actItemHeights[i] + (i < suggestions.length - 1 ? ACT_ITEM_GAP : 0)
        })

        // ── 6. Footer ─────────────────────────────────────────────────────────────

        doc.fillColor(C.muted).font(F.regular).fontSize(8.5)
            .text("Generated by Pebble  •  Powered by AWS", 0, PAGE_H - M, {
                align: "center",
                width: PAGE_W,
                lineBreak: false,
            })

        doc.end()
    })
}
