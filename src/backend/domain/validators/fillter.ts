// カレンダー用検索欄のフィルタリングロジック。TypeScript,Fastify,TypeBoxを使用。
// Fastifyの型について調べる。また、corsの正しいimport方法も探す。
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SearchQuery, type SearchQueryType }from './type/typebox';
import data from '../../data/users/base.json'

const fastify = Fastify();
// 2. フィルタリングエンドポイント
const start = async () =>{
  await fastify.register(cors , { origin:'http://localhost:5173'});

  fastify.get<{ Querystring: SearchQueryType }>(
  '/search',
  { schema: { querystring: SearchQuery } },
  async (request, reply) => {
    const { q } = request.query;

    if (!q) return data.basedata;

    // 特殊文字をエスケープ (正規表現としての動作を無効化)
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 大文字小文字を区別しない正規表現を作成
    const regex = new RegExp(escapedQuery, 'i');

    // フィルタリング実行
    return data.basedata.filter(d => regex.test(d.name));
  }
);

await fastify.listen({ port: 3000 });
};

start();

