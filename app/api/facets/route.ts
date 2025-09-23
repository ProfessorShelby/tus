import { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { hastaneler, tusPuanlar } from '@/db/schema';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('🚀 Facets API called');
  console.log('📊 Database URL exists:', !!process.env.TURSO_DATABASE_URL);
  console.log('🔑 Auth token exists:', !!process.env.TURSO_AUTH_TOKEN);
  
  try {
    console.log('📊 Starting database queries...');
    // Get distinct values for categorical facets
    const [sehirResult, tipResult, kurumTipiResult, bransResult, donemResult] = await Promise.all([
      db.select({ value: hastaneler.sehir })
        .from(hastaneler)
        .groupBy(hastaneler.sehir)
        .orderBy(hastaneler.sehir),
      
      db.select({ value: hastaneler.tip })
        .from(hastaneler)
        .groupBy(hastaneler.tip)
        .orderBy(hastaneler.tip),
      
      db.select({ value: hastaneler.kurumTipi })
        .from(hastaneler)
        .groupBy(hastaneler.kurumTipi)
        .orderBy(hastaneler.kurumTipi),
      
      db.select({ value: tusPuanlar.brans })
        .from(tusPuanlar)
        .groupBy(tusPuanlar.brans)
        .orderBy(tusPuanlar.brans),
      
      db.select({ value: tusPuanlar.donem })
        .from(tusPuanlar)
        .groupBy(tusPuanlar.donem)
        .orderBy(tusPuanlar.donem),
    ]);
    
    // Get numeric ranges
    const rangeResult = await db.select({
      tabanMin: sql<number>`MIN(${tusPuanlar.tabanPuan})`,
      tabanMax: sql<number>`MAX(${tusPuanlar.tabanPuan})`,
      kontMin: sql<number>`MIN(${tusPuanlar.kontenjan})`,
      kontMax: sql<number>`MAX(${tusPuanlar.kontenjan})`,
    }).from(tusPuanlar).where(sql`${tusPuanlar.tabanPuan} IS NOT NULL`);
    
    const range = rangeResult[0];
    
    const facets = {
      sehir: sehirResult.map(r => r.value).filter(Boolean),
      tip: tipResult.map(r => r.value).filter(Boolean),
      kurumTipi: kurumTipiResult.map(r => r.value).filter(Boolean),
      brans: bransResult.map(r => r.value).filter(Boolean),
      donem: donemResult.map(r => r.value).filter(Boolean),
      ranges: {
        tabanPuan: {
          min: range?.tabanMin || 0,
          max: range?.tabanMax || 100,
        },
        kontenjan: {
          min: range?.kontMin || 0,
          max: range?.kontMax || 1000,
        },
      },
    };
    
    console.log('✅ Facets data prepared:', {
      sehirCount: facets.sehir.length,
      bransCount: facets.brans.length,
      donemCount: facets.donem.length
    });
    
    return Response.json(facets, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Facets API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
