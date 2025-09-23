import { NextRequest } from 'next/server';
import { and, or, like, gte, lte, eq, sql, desc, asc, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { hastaneler, tusPuanlar } from '@/db/schema';
import { searchParamsSchema } from '@/lib/validations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  console.log('🔍 Search API called');
  console.log('📊 Database URL exists:', !!process.env.TURSO_DATABASE_URL);
  console.log('🔑 Auth token exists:', !!process.env.TURSO_AUTH_TOKEN);
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const rawParams: any = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.endsWith('[]') || ['sehir', 'tip', 'kurumTipi', 'brans', 'donem'].includes(key)) {
        const cleanKey = key.replace('[]', '');
        if (!rawParams[cleanKey]) rawParams[cleanKey] = [];
        rawParams[cleanKey].push(value);
      } else {
        // Handle empty strings and convert numbers properly
        if (value === '' || value === 'undefined') {
          rawParams[key] = undefined;
        } else if (!isNaN(Number(value)) && value !== '') {
          rawParams[key] = Number(value);
        } else {
          rawParams[key] = value;
        }
      }
    }
    
    const params = searchParamsSchema.parse(rawParams);
    console.log('📝 Search params:', JSON.stringify(params));
    
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
      conditions.push(inArray(hastaneler.sehir, params.sehir));
    }
    
    if (params.tip?.length) {
      conditions.push(inArray(hastaneler.tip, params.tip));
    }
    
    if (params.kurumTipi?.length) {
      conditions.push(inArray(hastaneler.kurumTipi, params.kurumTipi));
    }
    
    if (params.brans?.length) {
      conditions.push(inArray(tusPuanlar.brans, params.brans));
    }
    
    if (params.donem?.length) {
      conditions.push(inArray(tusPuanlar.donem, params.donem));
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
    console.log('🔧 Filter conditions applied:', conditions.length);
    console.log('🎯 Where clause exists:', !!whereClause);
    
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
    
    const response = {
      rows,
      total: count,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(count / params.pageSize),
    };
    
    console.log('✅ Search response prepared:', {
      totalCount: count,
      resultsCount: rows.length,
      page: params.page
    });
    
    return Response.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
