import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, real, index } from 'drizzle-orm/sqlite-core';

export const hastaneler = sqliteTable('hastaneler', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kurumKodu: integer('kurum_kodu').notNull().unique(),
  hastaneAdi: text('hastane_adi').notNull(),
  tip: text('tip').notNull(), // DEVLET, ÖZEL
  kurumTipi: text('kurum_tipi').notNull(), // Tıp Fakültesi, Hastane
  sehir: text('sehir').notNull(),
}, (table) => ({
  sehirIdx: index('idx_hastaneler_sehir').on(table.sehir),
  tipIdx: index('idx_hastaneler_tip').on(table.tip),
  kurumTipiIdx: index('idx_hastaneler_kurum_tipi').on(table.kurumTipi),
}));

export const tusPuanlar = sqliteTable('tus_puanlar', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kurumKodu: integer('kurum_kodu').notNull(),
  kadeTeKisaAdi: text('kade_te_kisa_adi').notNull(),
  kademe: text('kademe').notNull(),
  brans: text('brans').notNull(),
  donem: text('donem').notNull(), // 2024/1, 2024/2, etc.
  donemTarihi: text('donem_tarihi').notNull(),
  kontenjan: integer('kontenjan').notNull(),
  yerlesen: integer('yerlesen'), // can be null for latest period (2025/2)
  karsilanamayanKontenjan: integer('karsilanamayan_kontenjan'), // can be null for latest period (2025/2)
  tabanPuan: real('taban_puan'), // can be null if '--'
  tavanPuan: real('tavan_puan'), // can be null
  tabanSiralamasi: integer('taban_siralamasi'), // can be null
}, (table) => ({
  kurumKoduIdx: index('idx_tus_puanlar_kurum_kodu').on(table.kurumKodu),
  bransIdx: index('idx_tus_puanlar_brans').on(table.brans),
  donemIdx: index('idx_tus_puanlar_donem').on(table.donem),
  tabanPuanIdx: index('idx_tus_puanlar_taban_puan').on(table.tabanPuan),
  kontenjIdx: index('idx_tus_puanlar_kontenjan').on(table.kontenjan),
}));

// Types for TypeScript
export type Hastane = typeof hastaneler.$inferSelect;
export type TusPuan = typeof tusPuanlar.$inferSelect;
export type NewHastane = typeof hastaneler.$inferInsert;
export type NewTusPuan = typeof tusPuanlar.$inferInsert;
