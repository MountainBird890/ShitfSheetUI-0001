import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify'
import { Type, type Static } from '@sinclair/typebox'

const fastify = Fastify()

const ScheduleEntrySchema = Type.Object({
  date:  Type.String(),
  user:  Type.String(),
  start: Type.String(),
  end:   Type.String(),
  type:  Type.String(),
})

const BodySchema = Type.Array(ScheduleEntrySchema)
type ScheduleEntry = Static<typeof ScheduleEntrySchema>

function convertToCsv(data: ScheduleEntry[]): string {
  if (!data.length) return ''
  const headers = Object.keys(data[0]) as (keyof ScheduleEntry)[]
  return [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n')
}

fastify.post('/api/download/csv', {
  schema: { body: BodySchema }
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const data = request.body as ScheduleEntry[]
  const csv = convertToCsv(data)

  reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename*=UTF-8''勤務表.csv`)
    .send('\uFEFF' + csv)
})