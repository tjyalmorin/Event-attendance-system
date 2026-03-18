import { Request, Response } from 'express'
import ExcelJS from 'exceljs'
import asyncHandler from '../../middlewares/asyncHandler.js'
import { AppError, ValidationError } from '../../errors/AppError.js'
import {
  bulkImportParticipantsService,
  getBulkImportLogsByEventService,
  ImportRow
} from './bulk-import.service.js'

// ── Parse uploaded Excel/CSV buffer into rows ──────────────────────────────────
const parseImportFile = async (
  buffer: Buffer,
  mimetype: string
): Promise<ImportRow[]> => {
  const workbook = new ExcelJS.Workbook()

  if (mimetype === 'text/csv' || mimetype === 'application/csv') {
    const { Readable } = await import('stream')
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    await workbook.csv.read(readable)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any)
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new ValidationError('File has no worksheet')

  const rows: ImportRow[] = []
  let headerRow: string[] = []
  let isFirstRow = true

  worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1) // row.values is 1-indexed

    if (isFirstRow) {
      headerRow = values.map((v: ExcelJS.CellValue) =>
        String(v ?? '').toLowerCase().trim().replace(/\s+/g, '_')
      )
      isFirstRow = false
      return
    }

    // Skip completely empty rows
    if (values.every((v: ExcelJS.CellValue) => v === null || v === undefined || v === '')) return

    const getCol = (key: string): string => {
      const idx = headerRow.indexOf(key)
      if (idx === -1) return ''
      const val = values[idx]
      return val !== null && val !== undefined ? String(val).trim() : ''
    }

    rows.push({
      rowNumber,
      agent_code:  getCol('agent_code'),
      full_name:   getCol('full_name'),
      branch_name: getCol('branch_name'),
      team_name:   getCol('team_name'),
      agent_type:  getCol('agent_type'),
    })
  })

  if (rows.length === 0) throw new ValidationError('File contains no data rows')
  return rows
}

// ── Controllers ────────────────────────────────────────────────────────────────

export const bulkImportParticipants = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400)

  const event_id = Number(req.params.event_id)
  const imported_by = req.user!.user_id
  const file_name = req.file.originalname
  const mimetype = req.file.mimetype

  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
  ]
  if (!allowedMimes.includes(mimetype)) {
    throw new AppError('Only Excel (.xlsx) and CSV files are supported', 400)
  }

  const rows = await parseImportFile(req.file.buffer, mimetype)
  const result = await bulkImportParticipantsService(event_id, rows, imported_by, file_name)

  res.status(result.success ? 200 : 422).json(result)
})

export const getBulkImportLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await getBulkImportLogsByEventService(Number(req.params.event_id))
  res.json(logs)
})

export const downloadImportTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Participants Import')

  sheet.columns = [
    { header: 'agent_code',  key: 'agent_code',  width: 15 },
    { header: 'full_name',   key: 'full_name',   width: 30 },
    { header: 'branch_name', key: 'branch_name', width: 25 },
    { header: 'team_name',   key: 'team_name',   width: 25 },
    { header: 'agent_type',  key: 'agent_type',  width: 25 },
  ]

  // Style header row
  const headerRowStyle = sheet.getRow(1)
  headerRowStyle.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRowStyle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDC143C' },
  }

  // Sample rows
  sheet.addRow({ agent_code: '12345678', full_name: 'Juan Dela Cruz', branch_name: 'A1 Prime',      team_name: 'Team Norj', agent_type: 'Agent' })
  sheet.addRow({ agent_code: '87654321', full_name: 'Maria Santos',   branch_name: 'Alexandrite 1', team_name: 'Team Alou', agent_type: 'Branch Manager' })

  // Instructions sheet
  const info = workbook.addWorksheet('Instructions')
  info.getCell('A1').value  = 'BULK IMPORT INSTRUCTIONS'
  info.getCell('A1').font   = { bold: true, size: 13 }
  info.getCell('A3').value  = 'Required columns:'
  info.getCell('A3').font   = { bold: true }
  info.getCell('A4').value  = 'agent_code  — Unique agent code (max 50 characters)'
  info.getCell('A5').value  = 'full_name   — Full name of participant (max 255 characters)'
  info.getCell('A6').value  = 'branch_name — Branch name'
  info.getCell('A7').value  = 'team_name   — Team name'
  info.getCell('A8').value  = 'agent_type  — Agent type (must match an active agent type in the system)'
  info.getCell('A10').value = 'Rules:'
  info.getCell('A10').font  = { bold: true }
  info.getCell('A11').value = '• First row must be the header row (column names exactly as shown above)'
  info.getCell('A12').value = '• If ANY row has an error, the ENTIRE import is rejected'
  info.getCell('A13').value = '• Duplicate agent_code within the same event will cause an error'
  info.getCell('A14').value = '• Maximum 500 rows per import'
  info.getColumn('A').width = 70

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=primelog-import-template.xlsx')

  await workbook.xlsx.write(res)
  res.end()
})