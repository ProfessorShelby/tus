import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { hastaneler, tusPuanlar } from '../db/schema';
import path from 'path';

const client = createClient({
  url: 'libsql://tus-tercih-rehberi-tusrobotu.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTc0MjQ2MzEsImlkIjoiMjMyZTk5ZTctMTFiMS00NDA3LWFjNGQtN2QzNWY0ODljMjQ5IiwicmlkIjoiN2Q4Y2FjNGQtMDJlNy00NDVhLWI1ZWUtZjg0Y2NiYmU3NTZmIn0.FCytb4i5gNgV9kOP662g1ViYgr9MmNMcc4JCs_5aIT5HqD6erLr5GH1kA2QVr9xoV1BLiKCJLAYCmGXfkmGYDg',
});

const db = drizzle(client, { schema: { hastaneler, tusPuanlar } });

interface HastaneRow {
  kurumKodu: string;
  hastaneAdi: string;
  tip: string;
  kurumTipi: string;
  sehir: string;
}

interface TusPuanRow {
  id: string;
  kurumKodu: string;
  kadeTeKisaAdi: string;
  kademe: string;
  brans: string;
  donem: string;
  donemTarihi: string;
  kontenjan: string;
  yerlesen: string;
  karsilanamayanKontenjan: string;
  tabanPuan: string;
  tavanPuan: string;
  tabanSiralamasi: string;
}

function parseNumber(value: string): number | null {
  if (!value || value === 'NULL' || value === '--' || value.trim() === '') {
    return null;
  }
  
  // Replace comma with dot for decimal numbers
  const normalizedValue = value.replace(',', '.');
  const parsed = parseFloat(normalizedValue);
  
  return isNaN(parsed) ? null : parsed;
}

function parseInt(value: string): number | null {
  if (!value || value === 'NULL' || value === '--' || value.trim() === '') {
    return null;
  }
  
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

async function importHastaneler() {
  console.log('Importing hastaneler to Turso...');
  
  const csvPath = path.join(process.cwd(), 'data', 'HASTANELER.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    delimiter: ';',
    skip_empty_lines: true,
  }) as string[][];
  
  const hastaneData: any[] = [];
  
  for (const record of records) {
    if (record.length < 5) continue;
    
    const [kurumKoduStr, hastaneAdi, tip, kurumTipi, sehir] = record;
    const kurumKodu = parseInt(kurumKoduStr);
    
    if (kurumKodu === null) continue;
    
    hastaneData.push({
      kurumKodu,
      hastaneAdi: hastaneAdi.trim(),
      tip: tip.trim(),
      kurumTipi: kurumTipi.trim(),
      sehir: sehir.trim(),
    });
  }
  
  // Insert in batches
  const batchSize = 50; // Smaller batches for Turso
  for (let i = 0; i < hastaneData.length; i += batchSize) {
    const batch = hastaneData.slice(i, i + batchSize);
    await db.insert(hastaneler).values(batch);
    console.log(`Inserted hastaneler batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hastaneData.length / batchSize)}`);
  }
  
  console.log(`Imported ${hastaneData.length} hastaneler to Turso`);
}

async function importTusPuanlar() {
  console.log('Importing TUS puanlar to Turso...');
  
  const csvPath = path.join(process.cwd(), 'data', 'TUSPUANLAR.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    delimiter: ';',
    skip_empty_lines: true,
  }) as string[][];
  
  const tusPuanData: any[] = [];
  
  for (const record of records) {
    if (record.length < 13) continue;
    
    const [
      idStr,
      kurumKoduStr,
      kadeTeKisaAdi,
      kademe,
      brans,
      donem,
      donemTarihi,
      kontenjantStr,
      yerlesenStr,
      karsilanamayanKontenjantStr,
      tabanPuanStr,
      tavanPuanStr,
      tabanSiralamasiStr,
    ] = record;
    
    const kurumKodu = parseInt(kurumKoduStr);
    const kontenjan = parseInt(kontenjantStr);
    const yerlesen = parseInt(yerlesenStr);
    const karsilanamayanKontenjan = parseInt(karsilanamayanKontenjantStr);
    
    // Only require kurumKodu and kontenjan - yerlesen and karsilanamayanKontenjan can be null for 2025/2
    if (kurumKodu === null || kontenjan === null) {
      continue;
    }
    
    const tabanPuan = parseNumber(tabanPuanStr);
    const tavanPuan = parseNumber(tavanPuanStr);
    const tabanSiralamasi = parseInt(tabanSiralamasiStr);
    
    tusPuanData.push({
      kurumKodu,
      kadeTeKisaAdi: kadeTeKisaAdi.trim(),
      kademe: kademe.trim(),
      brans: brans.trim(),
      donem: donem.trim(),
      donemTarihi: donemTarihi.trim(),
      kontenjan,
      yerlesen,
      karsilanamayanKontenjan,
      tabanPuan,
      tavanPuan,
      tabanSiralamasi,
    });
  }
  
  // Insert in batches
  const batchSize = 50; // Smaller batches for Turso
  for (let i = 0; i < tusPuanData.length; i += batchSize) {
    const batch = tusPuanData.slice(i, i + batchSize);
    await db.insert(tusPuanlar).values(batch);
    console.log(`Inserted TUS puanlar batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tusPuanData.length / batchSize)}`);
  }
  
  console.log(`Imported ${tusPuanData.length} TUS puanlar records to Turso`);
}

async function main() {
  try {
    console.log('Starting CSV import to Turso...');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(tusPuanlar);
    await db.delete(hastaneler);
    
    await importHastaneler();
    await importTusPuanlar();
    
    console.log('Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
