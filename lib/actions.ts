'use server';

import { db } from '@/db/client';
import { hastaneler, tusPuanlar } from '@/db/schema';
import { and, or, like, gte, lte, eq, sql, desc, asc } from 'drizzle-orm';
import { searchParamsSchema } from './validations';

export async function getFacets() {
  try {
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
    
    return {
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
  } catch (error) {
    console.error('Get facets error:', error);
    throw new Error('Failed to fetch facets');
  }
}

export async function searchResults(searchParams: Record<string, string | string[]>) {
  try {
    // Parse and validate query parameters
    const rawParams: any = {};
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        rawParams[key] = value;
      } else {
        rawParams[key] = value;
      }
    }
    
    const params = searchParamsSchema.parse(rawParams);
    
    // Build where conditions
    const conditions = [];
    
    // Text search across hospital name and branch
    if (params.q) {
      conditions.push(
        or(
          like(hastaneler.hastaneAdi, `%${params.q}%`),
          like(tusPuanlar.brans, `%${params.q}%`)
        )
      );
    }
    
    // Categorical filters
    if (params.sehir?.length) {
      conditions.push(sql`${hastaneler.sehir} IN ${params.sehir}`);
    }
    
    if (params.tip?.length) {
      conditions.push(sql`${hastaneler.tip} IN ${params.tip}`);
    }
    
    if (params.kurumTipi?.length) {
      conditions.push(sql`${hastaneler.kurumTipi} IN ${params.kurumTipi}`);
    }
    
    if (params.brans?.length) {
      conditions.push(sql`${tusPuanlar.brans} IN ${params.brans}`);
    }
    
    if (params.donem?.length) {
      conditions.push(sql`${tusPuanlar.donem} IN ${params.donem}`);
    }
    
    // Numeric range filters
    if (params.tabanMin !== undefined) {
      conditions.push(gte(tusPuanlar.tabanPuan, params.tabanMin));
    }
    
    if (params.tabanMax !== undefined) {
      conditions.push(lte(tusPuanlar.tabanPuan, params.tabanMax));
    }
    
    if (params.kontMin !== undefined) {
      conditions.push(gte(tusPuanlar.kontenjan, params.kontMin));
    }
    
    if (params.kontMax !== undefined) {
      conditions.push(lte(tusPuanlar.kontenjan, params.kontMax));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Build order by clause
    let orderBy;
    const direction = params.sortOrder === 'desc' ? desc : asc;
    
    switch (params.sortBy) {
      case 'hastaneAdi':
        orderBy = direction(hastaneler.hastaneAdi);
        break;
      case 'sehir':
        orderBy = direction(hastaneler.sehir);
        break;
      case 'brans':
        orderBy = direction(tusPuanlar.brans);
        break;
      case 'donem':
        orderBy = direction(tusPuanlar.donem);
        break;
      case 'tabanPuan':
        orderBy = direction(tusPuanlar.tabanPuan);
        break;
      case 'kontenjan':
        orderBy = direction(tusPuanlar.kontenjan);
        break;
      default:
        orderBy = asc(hastaneler.hastaneAdi);
    }
    
    // Build the main query
    const baseQuery = db
      .select({
        id: tusPuanlar.id,
        kurumKodu: hastaneler.kurumKodu,
        hastaneAdi: hastaneler.hastaneAdi,
        sehir: hastaneler.sehir,
        tip: hastaneler.tip,
        kurumTipi: hastaneler.kurumTipi,
        brans: tusPuanlar.brans,
        donem: tusPuanlar.donem,
        kademe: tusPuanlar.kademe,
        kontenjan: tusPuanlar.kontenjan,
        yerlesen: tusPuanlar.yerlesen,
        tabanPuan: tusPuanlar.tabanPuan,
        tavanPuan: tusPuanlar.tavanPuan,
        tabanSiralamasi: tusPuanlar.tabanSiralamasi,
      })
      .from(tusPuanlar)
      .innerJoin(hastaneler, eq(tusPuanlar.kurumKodu, hastaneler.kurumKodu));
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tusPuanlar)
      .innerJoin(hastaneler, eq(tusPuanlar.kurumKodu, hastaneler.kurumKodu))
      .where(whereClause);
    
    const count = countResult[0]?.count || 0;
    
    // Get paginated results
    const offset = (params.page - 1) * params.pageSize;
    const rows = await baseQuery
      .where(whereClause)
      .orderBy(orderBy)
      .limit(params.pageSize)
      .offset(offset);
    
    return {
      rows,
      total: count,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(count / params.pageSize),
    };
  } catch (error) {
    console.error('Search results error:', error);
    throw new Error('Failed to fetch search results');
  }
}
