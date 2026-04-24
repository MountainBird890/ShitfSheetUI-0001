import Fastify,{ type FastifyInstance } from 'fastify';
import type{ TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fs from 'fs/promises';
import { StaffWorkSchema, type StaffWork } from '../../../data/basetype';

const app:FastifyInstance = Fastify();
const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();
const DATA_PATH = './data/users/base.json';

typedApp.put('/api/data', {
  schema: { body: StaffWorkSchema },
}, async (request, reply) => {
  const newData = request.body;

  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  const current = JSON.parse(raw);
  const items: StaffWork[] = current.basedata;

  const updated = items.map(item =>
    item.staffId === newData.staffId ? { ...item, ...newData } : item
  );

  await fs.writeFile(DATA_PATH, JSON.stringify({ basedata: updated }, null, 2), 'utf-8');

  return reply.send({ ok: true });
});