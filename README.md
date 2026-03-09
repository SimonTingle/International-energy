# Global Energy Resources Dashboard

An interactive web application displaying live energy resources per country with real-time data visualization and live data scraping capabilities.

**✅ Zero Cost - All APIs are completely free, no credit card required!**

## Features

- 🌍 **Interactive World Map**: Hover over countries to view energy statistics (OpenStreetMap + Leaflet)
- 📊 **Real-time Data**: Live scraping from free public APIs (EIA, World Bank)
- 🔄 **Expandable Side Panel**: Quick stats with option to expand for detailed analysis
- ⚡ **Energy Resources Tracked**: Oil, Natural Gas, Coal, Diesel, Renewables, Nuclear
- 📈 **Historical Data**: Database stores resource data over time for trend analysis
- 🔐 **Secure API Integration**: Protected endpoints with cron job scheduling
- 🚀 **Vercel Optimized**: Built for serverless deployment with Vercel Postgres
- 💰 **Completely Free**: No APIs require credit cards or paid plans

## Tech Stack

### Frontend
- **Next.js 15**: React framework with server-side rendering
- **Leaflet + OpenStreetMap**: Free, open-source map visualization (no API key needed)
- **Tailwind CSS**: Modern styling
- **Zustand**: State management
- **TypeScript**: Type safety

### Backend
- **Next.js API Routes**: Serverless functions
- **PostgreSQL**: Data persistence (optional, uses sample data if not configured)
- **Axios**: HTTP client for API integration

### Data Sources (All FREE)
- **EIA** (U.S. Energy Information Administration): Energy production data - [Free API](https://www.eia.gov/opendata/)
- **World Bank**: Renewable energy indicators - [Free Public API](https://data.worldbank.org/)
- **OpenStreetMap**: Map tiles - [Completely Free](https://www.openstreetmap.org/)

### Deployment
- **Vercel**: Hosting and edge functions (free tier available)
- **Vercel Postgres**: Database (optional, free tier available)
- **Vercel Cron Jobs**: Scheduled data updates

## Getting Started (5 minutes)

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Quick Start (Works immediately, no API keys needed!)

1. **Clone the repository**
   ```bash
   git clone <repository>
   cd international-energy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and see it working!

That's it! The app works with sample data and free APIs. No configuration needed.

### Optional: Add Real-Time Data

To get live energy data from real APIs (still completely free):

1. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

2. **Add EIA API Key (Optional, Free)**
   - Register at [EIA OpenData](https://www.eia.gov/opendata/register/)
   - Takes 2 minutes, no credit card needed
   - Copy API key to `EIA_API_KEY` in `.env.local`

3. **World Bank API** (Already works, no setup needed!)
   - Automatically integrated
   - No API key required
   - Provides renewable energy data for all countries

4. **Trigger data scraper**
   ```bash
   curl -X POST http://localhost:3000/api/scraper/run
   ```

### Database Setup (Optional)

The app works perfectly without a database using sample data!

#### Add PostgreSQL (Optional)

```bash
# Create local database
createdb energy_resources

# Set DATABASE_URL in .env.local
export DATABASE_URL="postgresql://user:password@localhost:5432/energy_resources"

# Initialize schema
curl -X POST http://localhost:3000/api/db/init
```

#### Use Vercel Postgres (Free tier available)

1. Create Vercel Postgres database in your Vercel project
2. Copy connection string to `DATABASE_URL` in `.env.local`
3. Schema auto-initializes on first deploy

## Free APIs Explained

### Why These APIs?

| API | Cost | Credit Card | Ease of Setup | Data Quality |
|-----|------|-------------|---------------|--------------|
| **OpenStreetMap** | FREE | ❌ No | 5 min | Excellent |
| **EIA** | FREE | ❌ No | 2 min | Official US Data |
| **World Bank** | FREE | ❌ No | 0 min | UN-backed Data |

### OpenStreetMap + Leaflet
- Completely open source and free
- Hosted by volunteers worldwide
- No API key or registration needed
- Works offline with downloaded tiles
- Professional quality map tiles

### EIA API
- Official U.S. Energy Information Administration
- Free tier: unlimited requests
- Coverage: US energy data (oil, gas, coal, renewables, nuclear)
- Registration: 2 minutes, email only
- Website: https://www.eia.gov/opendata/

### World Bank API
- Global energy and environmental data
- Completely free public API
- No registration, no API key, no rate limits
- Coverage: All countries (renewable capacity, efficiency, etc.)
- Website: https://data.worldbank.org/

## Project Structure

```
.
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page with map
│   ├── globals.css          # Global styles
│   └── api/
│       ├── countries/       # Fetch country data
│       ├── db/init/         # Database initialization
│       └── scraper/run/     # Trigger data scrapers
├── components/
│   ├── EnergyMap.tsx        # Interactive Leaflet map
│   ├── EnergyPanel.tsx      # Expandable side panel
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── store.ts             # Zustand state management
│   ├── data.ts              # Data utilities
│   ├── db.ts                # Database functions (optional)
│   └── scrapers/
│       ├── worldbank-scraper.ts
│       ├── eia-scraper.ts
│       └── orchestrator.ts  # Scraper coordinator
├── public/
│   └── countries-data.json  # Sample data
├── .env.example             # Environment variables template
├── next.config.ts
├── tailwind.config.ts
├── vercel.json              # Cron job config
└── package.json
```

## API Endpoints

### GET `/api/countries`
Fetch all countries with their energy resources
```bash
curl http://localhost:3000/api/countries
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "SA",
      "name": "Saudi Arabia",
      "region": "Middle East",
      "resources": {
        "oil": 266.2,
        "gas": 324.9,
        ...
      },
      "lastUpdated": "2026-03-09"
    }
  ],
  "timestamp": "2026-03-09T..."
}
```

### POST `/api/db/init`
Initialize database with sample data (optional)
```bash
curl -X POST http://localhost:3000/api/db/init
```

### POST `/api/scraper/run`
Manually trigger data scrapers
```bash
curl -X POST http://localhost:3000/api/scraper/run
```

## Data Scraping Strategy

### Automatic Scheduling
- **Frequency**: Every 12 hours via Vercel Cron (configurable in `vercel.json`)
- **Parallel Execution**: Runs all free APIs simultaneously
- **Error Handling**: Logs failures, continues with other sources
- **Database**: Stores historical data for trends (if DB configured)

### Manual Scraping
```bash
# Local development
curl -X POST http://localhost:3000/api/scraper/run

# Production (requires CRON_SECRET)
curl -X POST https://your-domain.vercel.app/api/scraper/run \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Database Schema (Optional)

Only needed if you want to store historical data. App works perfectly without it!

### Countries Table
```sql
CREATE TABLE countries (
  id VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100),
  region VARCHAR(50),
  coordinates POINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Energy Resources Table
```sql
CREATE TABLE energy_resources (
  id SERIAL PRIMARY KEY,
  country_id VARCHAR(2) REFERENCES countries(id),
  oil DECIMAL(10, 2),
  gas DECIMAL(12, 2),
  coal DECIMAL(10, 2),
  diesel DECIMAL(10, 2),
  renewables DECIMAL(10, 2),
  nuclear DECIMAL(10, 2),
  source VARCHAR(100),
  timestamp TIMESTAMP,
  created_at TIMESTAMP
);
```

### Scrape Logs Table
```sql
CREATE TABLE scrape_logs (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100),
  status VARCHAR(20),
  records_collected INTEGER,
  error_message TEXT,
  created_at TIMESTAMP
);
```

## Deployment to Vercel (Free!)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select GitHub repository
   - Click Import

3. **Set Environment Variables**
   - `EIA_API_KEY` (optional): Your free EIA API key
   - `CRON_SECRET`: Random secure token
   - Database URL (optional): Vercel Postgres

4. **Deploy**
   - Vercel automatically deploys on push
   - Cron jobs run on schedule
   - App works immediately with sample data!

## Customization

### Add New Data Sources

Create new scraper in `lib/scrapers/your-source.ts`:

```typescript
export async function scrapeYourSource(): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  try {
    const response = await axios.get('https://api.example.com/data');
    // Parse and aggregate data
    return results;
  } catch (error) {
    console.error('Scraper error:', error);
    return results;
  }
}
```

Add to orchestrator in `lib/scrapers/orchestrator.ts`.

### Modify Map Appearance

Edit `components/EnergyMap.tsx`:
- Change marker colors
- Adjust map zoom/center
- Customize popups
- Add new tile layers

### Change Update Frequency

Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scraper/run",
    "schedule": "0 */12 * * *"  // Every 12 hours
  }]
}
```

Use [crontab.guru](https://crontab.guru) for schedule help.

## Free API Alternatives

Need more data sources? Here are other free APIs (no credit card):

- **Global Power Plant Database**: Coal, gas, hydro, nuclear plants
- **IEA Statistics**: International energy data (some free resources)
- **UN Comtrade**: International energy trade data
- **IRENA**: Renewable energy statistics (some public datasets)
- **OpenWeather**: Renewable energy generation forecasts

## Troubleshooting

### "Map not loading"
- Leaflet is loaded via CDN from unpkg.com
- Check internet connection
- Verify `leaflet.css` link in `app/layout.tsx`

### "API errors in console"
- World Bank API works without setup
- EIA requires registration (takes 2 minutes)
- Check `EIA_API_KEY` if configured

### "No data showing"
- Sample data loads by default
- Run `curl -X POST http://localhost:3000/api/scraper/run`
- Check browser console for errors

### "Database connection error"
- Database is optional, app works without it
- Remove `DATABASE_URL` to use sample data
- Only needed for historical tracking

## Performance Tips

- **ISR**: Pages revalidate every hour (configurable)
- **Caching**: API responses cached for 1 hour
- **Lazy Loading**: Map loads asynchronously
- **Optimized**: ~100KB bundle size

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes and test locally
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/name`
6. Create Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](../../issues)
- Discussions: [GitHub Discussions](../../discussions)

## Future Enhancements

- [ ] User authentication and bookmarks
- [ ] Export data as CSV/Excel
- [ ] Historical trend charts
- [ ] Price alerts for resource changes
- [ ] Mobile app version
- [ ] Advanced filtering and search
- [ ] Comparative analysis tools
- [ ] API documentation

## Cost Breakdown

| Service | Free Tier | Cost | Credit Card |
|---------|-----------|------|------------|
| **Map (Leaflet + OSM)** | Unlimited | $0 | ❌ No |
| **EIA API** | Unlimited | $0 | ❌ No |
| **World Bank API** | Unlimited | $0 | ❌ No |
| **Vercel Hosting** | 100GB bandwidth | $0 | ❌ No |
| **Vercel Postgres** | 3 databases, 7 days backup | $0 | ❌ No |
| **GitHub** | Unlimited public repos | $0 | ❌ No |
| **Total** | **Everything!** | **$0** | **✅ None!** |

This is truly a free, fully-functional energy dashboard!
