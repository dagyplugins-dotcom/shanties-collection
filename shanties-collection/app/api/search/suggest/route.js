import { NextResponse } from 'next/server';
import { suggest } from '@/lib/data';

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get('q') || '').slice(0, 60);
  const data = q.trim().length >= 2 ? await suggest(q) : { products: [], categories: [] };
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } });
}
