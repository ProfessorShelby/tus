# TUS Tercih Rehberi

A modern, serverless web application for exploring TUS (Tıpta Uzmanlık Sınavı) results and planning medical residency choices.

## Features

- 🔍 **Advanced Filtering**: Search by hospital, city, branch, period, score ranges, and more
- 📊 **Comprehensive Data**: View quota, placement numbers, base scores, and rankings
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- ⚡ **Fast & Secure**: Serverless architecture with rate limiting and API key protection
- 📈 **Google AdSense Integration**: Monetization support
- 📥 **CSV Export**: Export filtered results for further analysis
- 🔗 **Bookmarkable URLs**: Share specific filter combinations

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Database**: Turso (LibSQL) with Drizzle ORM
- **UI Components**: TanStack Table, TanStack Query
- **Deployment**: Vercel (recommended)
- **Icons**: Heroicons

## Quick Start

### 1. Database Setup (Turso)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create tus-tercih-rehberi

# Get database URL and auth token
turso db show tus-tercih-rehberi
turso db tokens create tus-tercih-rehberi
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your values:
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your-auth-token
READONLY_API_KEY=your-very-long-random-string-here

# Optional: Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_ADSENSE_SLOT=xxxxxxxxxx
```

### 3. Install Dependencies & Setup Database

```bash
npm install

# Generate database schema
npm run db:generate

# Apply migrations
npm run db:migrate

# Import CSV data
npm run db:seed
```

### 4. Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/tus-tercih-rehberi.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     - `TURSO_DATABASE_URL`
     - `TURSO_AUTH_TOKEN`
     - `READONLY_API_KEY`
     - `NEXT_PUBLIC_ADSENSE_CLIENT` (optional)
     - `NEXT_PUBLIC_ADSENSE_SLOT` (optional)

3. **Deploy**: Vercel will automatically deploy your app

### Alternative: Cloudflare Pages + D1

If you prefer Cloudflare:

1. Update `drizzle.config.ts` to use Cloudflare D1
2. Replace Turso client with Cloudflare D1 bindings
3. Deploy to Cloudflare Pages

## Data Structure

### Hospitals (`hastaneler`)
- Hospital/Institution information
- City, type (public/private), institution type
- Indexed for fast filtering

### TUS Scores (`tus_puanlar`)
- Branch-specific placement data
- Quota, placements, base scores, rankings
- Period-based historical data

### API Endpoints

- `GET /api/facets` - Get filter options and ranges
- `GET /api/search` - Search with filters and pagination

## Security Features

- **API Key Protection**: All endpoints require valid API key
- **Rate Limiting**: 30 requests per minute per IP
- **No Raw Data Access**: Only filtered, paginated responses
- **CORS Protection**: Same-origin only

## Performance Optimizations

- **Edge Runtime**: API routes run on edge for low latency
- **Database Indexing**: Optimized queries with proper indexes
- **Client-side Caching**: TanStack Query for efficient data fetching
- **Pagination**: Limited result sets for fast loading

## CSV Data Format

### HASTANELER.csv
```
kurumKodu;hastaneAdi;tip;kurumTipi;sehir
1;Acıbadem Mehmet Ali Aydınlar Üniversitesi Tıp Fakültesi;DEVLET;Tıp Fakültesi;İSTANBUL ANADOLU
```

### TUSPUANLAR.csv
```
id;kurumKodu;kadeTeKisaAdi;kademe;brans;donem;donemTarihi;kontenjan;yerlesen;karsilanamayanKontenjan;tabanPuan;tavanPuan;tabanSiralamasi
1;185;MSB;MİLLİ SAVUNMA BAKANLIĞI;Acil Tıp;2025/1;2025-01-01 00:00:00.000;1;1;0;56,8;NULL;7467
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply migrations
- `npm run db:seed` - Import CSV data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

**Note**: This application is designed for educational and research purposes. Always verify medical education information with official sources.