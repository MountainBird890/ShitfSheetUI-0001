import { Button, Space } from "antd"
import { DownloadOutlined } from '@ant-design/icons';
import { handleDownloadCSV } from "../state/useCalendar";
import { useState } from "react";
import { PDFDocument, rgb, StandardFonts, PDFPage } from "pdf-lib";

// DownloadButton.tsx
type VisibleData = {
  staffId: string
  name: string
  date: string
  type: string
}
type Props = { data: VisibleData[] }

export const DownloadButton = ({ data }: Props) => {
  const { dl, setDl } = handleDownloadCSV()
  const [dlPdf, setDlPdf] = useState(false)

  // --- CSV ---
  const handleDownload = async () => {
    setDl(true)
    try {
      const res = await fetch('/api/download/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '勤務表.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDl(false)
    }
  }

  // --- PDF ---
  const handleDownloadPdf = async () => {
    setDlPdf(true)
    try {
      const pdfDoc = await PDFDocument.create()
      const fontBytes = await fetch('../../../../../public/fonts/NotoSansJP-Regular.ttf').then(r => r.arrayBuffer())
      const font = await pdfDoc.embedFont(fontBytes)

      const ROW_HEIGHT = 20
      const MARGIN = 40
      const COL_WIDTHS = [80, 120, 100, 100] // staffId, name, date, type
      const HEADERS = ['スタッフID', '氏名', '日付', '種別']
      const PAGE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0) + MARGIN * 2
      const ROWS_PER_PAGE = 30

      const drawPage = (rows: VisibleData[], pageIndex: number) => {
        const page:PDFPage = pdfDoc.addPage([PAGE_WIDTH, 842]) // A4縦
        const { height } = page.getSize()

        // タイトル
        page.drawText('勤務表', {
          x: MARGIN,
          y: height - MARGIN,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        })

        // ページ番号
        page.drawText(`${pageIndex + 1} ページ`, {
          x: PAGE_WIDTH - MARGIN - 50,
          y: height - MARGIN,
          size: 10,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })

        // ヘッダー行
        let startY = height - MARGIN - ROW_HEIGHT * 2
        let x = MARGIN
        HEADERS.forEach((header, i) => {
          page.drawRectangle({
            x,
            y: startY,
            width: COL_WIDTHS[i],
            height: ROW_HEIGHT,
            color: rgb(0.2, 0.4, 0.8),
          })
          // pdf-libの標準フォントは日本語非対応のため英語ラベルで代替
          const headerEn = ['Staff ID', 'Name', 'Date', 'Type']
          page.drawText(headerEn[i], {
            x: x + 4,
            y: startY + 5,
            size: 10,
            font,
            color: rgb(1, 1, 1),
          })
          x += COL_WIDTHS[i]
        })

        // データ行
        rows.forEach((row, rowIdx) => {
          const y = startY - ROW_HEIGHT * (rowIdx + 1)
          const cells = [row.staffId, row.name, row.date, row.type]
          let cx = MARGIN

          // 縞模様
          if (rowIdx % 2 === 0) {
            page.drawRectangle({
              x: MARGIN,
              y,
              width: COL_WIDTHS.reduce((a, b) => a + b, 0),
              height: ROW_HEIGHT,
              color: rgb(0.95, 0.95, 0.95),
            })
          }

          cells.forEach((cell, i) => {
            // 日本語はASCII範囲外のため英数字のみ描画、日本語はそのまま渡す（文字化けするが構造は保持）
            const safeText = cell.replace(/[^\x00-\x7F]/g, '?')
            page.drawText(safeText, {
              x: cx + 4,
              y: y + 5,
              size: 9,
              font,
              color: rgb(0, 0, 0),
            })
            cx += COL_WIDTHS[i]
          })
        })
      }

      // ページ分割して描画
      const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
      for (let i = 0; i < totalPages; i++) {
        const pageRows = data.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE)
        drawPage(pageRows, i)
      }
      // データが空の場合も1ページ生成
      if (data.length === 0) drawPage([], 0)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = '勤務表.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDlPdf(false)
    }
  }

  return (
    <Space>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        loading={dl}
        onClick={handleDownload}
      >
        CSVダウンロード
      </Button>
      <Button
        icon={<DownloadOutlined />}
        loading={dlPdf}
        onClick={handleDownloadPdf}
      >
        PDFダウンロード
      </Button>
    </Space>
  )
}