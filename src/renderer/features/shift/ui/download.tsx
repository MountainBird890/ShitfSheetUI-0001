import { Button, Space } from "antd"
import { DownloadOutlined } from '@ant-design/icons'
import { useState } from "react"
import { PDFDocument, rgb, PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { apiUrl } from "../../../../lib/api"

type VisibleData = {
  staffId: string
  name: string
  user: string
  date: string
  start: string
  end: string
  type: string
}

type Props = {
  data: VisibleData[]
  fileName: string    // ★ 追加
  label: string       // ★ 追加（PDF上の名前表示用）
}

export const DownloadButton = ({ data, fileName, label }: Props) => {
  const [dlCsv, setDlCsv] = useState(false)
  const [dlPdf, setDlPdf] = useState(false)

  // ★ 日付昇順ソート
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))

  // --- CSV ---
const handleDownloadCsv = async () => {
  setDlCsv(true)
  try {
    const BOM = '\uFEFF'
    const headers = ['日付', '氏名', '開始', '終了', 'ご利用者', '種別']
    const rows = sortedData.map(row => [
      row.date,
      row.name,
      row.start,
      row.end,
      row.user,
      row.type,
    ])
    const csv = BOM + [headers, ...rows]
      .map(r => r.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    setDlCsv(false)
  }
}

  // --- PDF ---
  const handleDownloadPdf = async () => {
    setDlPdf(true)
    try {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.registerFontkit(fontkit)
      const fontBytes = await fetch(apiUrl('/api/fonts/NotoSansJP-VariableFont_wght.ttf'))
        .then(r => r.arrayBuffer())
      const font = await pdfDoc.embedFont(fontBytes)

      const ROW_HEIGHT = 20
      const MARGIN = 40
      // ★ StaffIDを削除、日付を左端に
      const COL_WIDTHS = [80, 120, 60, 60, 80, 100]
      const HEADERS = ['日付', '氏名', '開始', '終了', 'ご利用者', '種別']
      const PAGE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0) + MARGIN * 2
      const ROWS_PER_PAGE = 30

      const drawPage = (rows: VisibleData[], pageIndex: number) => {
        const page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, 842])
        const { height } = page.getSize()

        // ★ タイトルにlabelを使用
        page.drawText(`勤務表　${label}`, {
          x: MARGIN,
          y: height - MARGIN,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        })

        page.drawText(`${pageIndex + 1} ページ`, {
          x: PAGE_WIDTH - MARGIN - 50,
          y: height - MARGIN,
          size: 10,
          font,
          color: rgb(0.4, 0.4, 0.4),
        })

        const startY = height - MARGIN - ROW_HEIGHT * 2
        let x = MARGIN
        HEADERS.forEach((header, i) => {
          page.drawRectangle({
            x,
            y: startY,
            width: COL_WIDTHS[i],
            height: ROW_HEIGHT,
            color: rgb(0.2, 0.4, 0.8),
          })
          page.drawText(header, {
            x: x + 4,
            y: startY + 5,
            size: 10,
            font,
            color: rgb(1, 1, 1),
          })
          x += COL_WIDTHS[i]
        })

        rows.forEach((row, rowIdx) => {
          const y = startY - ROW_HEIGHT * (rowIdx + 1)
          // ★ StaffID削除、日付を左端、開始・終了・利用者を追加
          const cells = [row.date, row.name, row.start, row.end, row.user, row.type]
          let cx = MARGIN

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
            page.drawText(cell ?? '', {
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

      const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE)
      for (let i = 0; i < totalPages; i++) {
        drawPage(sortedData.slice(i * ROWS_PER_PAGE, (i + 1) * ROWS_PER_PAGE), i)
      }
      if (sortedData.length === 0) drawPage([], 0)

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}.pdf`  // ★ 動的ファイル名
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDlPdf(false)
    }
  }

  return (
    <Space>
      <Button type="primary" icon={<DownloadOutlined />} loading={dlCsv} onClick={handleDownloadCsv}>
        CSVダウンロード
      </Button>
      <Button icon={<DownloadOutlined />} loading={dlPdf} onClick={handleDownloadPdf}>
        PDFダウンロード
      </Button>
    </Space>
  )
}