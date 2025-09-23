import { z } from 'zod';

export const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
  sehir: z.array(z.string()).optional(),
  tip: z.array(z.string()).optional(),
  kurumTipi: z.array(z.string()).optional(),
  brans: z.array(z.string()).optional(),
  donem: z.array(z.string()).optional(),
  tabanMin: z.coerce.number().min(0).max(100).optional(),
  tabanMax: z.coerce.number().min(0).max(100).optional(),
  kontMin: z.coerce.number().min(0).optional(),
  kontMax: z.coerce.number().min(0).optional(),
  sortBy: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional field
      
      // Allow basic field names
      const basicFields = ['hastaneAdi', 'sehir', 'brans', 'donem', 'tabanPuan', 'kontenjan'];
      if (basicFields.includes(val)) return true;
      
      // Allow period-specific patterns like "puan-2025/1", "kontenjan-2024/2", "siralama-2023/2"
      const periodPattern = /^(kontenjan|puan|siralama)-\d{4}\/[12]$/;
      return periodPattern.test(val);
    },
    {
      message: "Invalid sortBy field. Must be a basic field or period-specific pattern like 'puan-2025/1'"
    }
  ),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export const facetSchema = z.object({
  field: z.enum(['sehir', 'tip', 'kurumTipi', 'brans', 'donem']).optional(),
});

export type FacetParams = z.infer<typeof facetSchema>;
