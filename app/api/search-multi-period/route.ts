import { NextRequest } from 'next/server';
import { and, or, like, gte, lte, eq, sql, desc, asc, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { hastaneler, tusPuanlar } from '@/db/schema';
import { isRateLimited, getRealIP } from '@/lib/auth';
import { searchParamsSchema } from '@/lib/validations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('🔍 Multi-period search API called');
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
    console.log('🌐 Raw URL searchParams:', request.url);
    console.log('🔍 Raw params before parsing:', JSON.stringify(rawParams));
    
    // Get the latest 4 periods
    const periodsResult = await db
      .select({ donem: tusPuanlar.donem })
      .from(tusPuanlar)
      .groupBy(tusPuanlar.donem)
      .orderBy(desc(tusPuanlar.donem))
      .limit(4);
    
    const periods = periodsResult.map(p => p.donem);
    
    // Build where conditions for the base data filtering
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
    
    // Numeric range filters (only consider latest period for filtering)
    if (params.tabanMin !== undefined || params.tabanMax !== undefined || params.kontMin !== undefined || params.kontMax !== undefined) {
      const latestPeriod = periods[0];
      conditions.push(eq(tusPuanlar.donem, latestPeriod));
      
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
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    console.log('🔧 Filter conditions applied:', conditions.length);
    console.log('🎯 Where clause exists:', !!whereClause);
    
    // Get unique hospital+branch combinations that match filters
    const uniqueCombinationsQuery = db
      .select({
        kurumKodu: hastaneler.kurumKodu,
        hastaneAdi: hastaneler.hastaneAdi,
        sehir: hastaneler.sehir,
        tip: hastaneler.tip,
        kurumTipi: hastaneler.kurumTipi,
        brans: tusPuanlar.brans,
        kademe: tusPuanlar.kademe,
      })
      .from(tusPuanlar)
      .innerJoin(hastaneler, eq(tusPuanlar.kurumKodu, hastaneler.kurumKodu));
    
    if (whereClause) {
      uniqueCombinationsQuery.where(whereClause);
    }
    
    const uniqueCombinations = await uniqueCombinationsQuery
      .groupBy(hastaneler.kurumKodu, tusPuanlar.brans, tusPuanlar.kademe)
      .orderBy(asc(hastaneler.hastaneAdi));
    
    // Get total count of unique combinations
    const totalCount = uniqueCombinations.length;
    
    // Apply pagination to unique combinations
    const offset = (params.page - 1) * params.pageSize;
    const paginatedCombinations = uniqueCombinations.slice(offset, offset + params.pageSize);
    
    // Get all period data for paginated combinations in ONE query (batch query)
    const comboConditions = paginatedCombinations.map(combo =>
      and(
        eq(tusPuanlar.kurumKodu, combo.kurumKodu),
        eq(tusPuanlar.brans, combo.brans),
        eq(tusPuanlar.kademe, combo.kademe)
      )
    );
    
    // Single batch query to get all period data
    const allPeriodData = comboConditions.length > 0 ? await db
      .select({
        kurumKodu: tusPuanlar.kurumKodu,
        brans: tusPuanlar.brans,
        kademe: tusPuanlar.kademe,
        donem: tusPuanlar.donem,
        kontenjan: tusPuanlar.kontenjan,
        yerlesen: tusPuanlar.yerlesen,
        tabanPuan: tusPuanlar.tabanPuan,
        tavanPuan: tusPuanlar.tavanPuan,
        tabanSiralamasi: tusPuanlar.tabanSiralamasi,
      })
      .from(tusPuanlar)
      .where(
        and(
          or(...comboConditions),
          inArray(tusPuanlar.donem, periods)
        )
      )
      .orderBy(desc(tusPuanlar.donem)) : [];
    
    // Group period data by combination key
    const periodDataMap = new Map<string, Record<string, any>>();
    allPeriodData.forEach(data => {
      const key = `${data.kurumKodu}-${data.brans}-${data.kademe}`;
      if (!periodDataMap.has(key)) {
        periodDataMap.set(key, {});
      }
      periodDataMap.get(key)![data.donem] = data;
    });
    
    // Build results using the grouped data
    const results = paginatedCombinations.map(combo => {
      const key = `${combo.kurumKodu}-${combo.brans}-${combo.kademe}`;
      const comboPeriodsData = periodDataMap.get(key) || {};
      
      const result = {
        id: key,
        kurumKodu: combo.kurumKodu,
        hastaneAdi: combo.hastaneAdi,
        sehir: combo.sehir,
        tip: combo.tip,
        kurumTipi: combo.kurumTipi,
        brans: combo.brans,
        kademe: combo.kademe,
        periods: {} as Record<string, {
          kontenjan: number | null;
          yerlesen: number | null;
          tabanPuan: number | null;
          tabanSiralamasi: number | null;
        }>
      };
      
      // Add data for each period (or null if no data)
      periods.forEach(period => {
        const periodData = comboPeriodsData[period];
        result.periods[period] = periodData ? {
          kontenjan: periodData.kontenjan,
          yerlesen: periodData.yerlesen,
          tabanPuan: periodData.tabanPuan,
          tabanSiralamasi: periodData.tabanSiralamasi,
        } : {
          kontenjan: null,
          yerlesen: null,
          tabanPuan: null,
          tabanSiralamasi: null,
        };
      });
      
      return result;
    });
    
    const response = {
      rows: results,
      periods: periods, // Return the periods for table headers
      total: totalCount,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(totalCount / params.pageSize),
    };
    
    console.log('✅ Multi-period response prepared:', {
      totalCount,
      resultsCount: results.length,
      periodsCount: periods.length
    });
    
    return Response.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Total-Count': totalCount.toString(),
      },
    });
  } catch (error) {
    console.error('Multi-period search API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
