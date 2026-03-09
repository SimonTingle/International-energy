# Global Energy Resources Dashboard

An interactive web application displaying live energy resources per country with real-time data visualization and live data scraping capabilities.

## Features

- 🌍 **Interactive World Map**: Hover over countries to view energy statistics
- 📊 **Real-time Data**: Live scraping from IEA, EIA, and World Bank APIs
- 🔄 **Expandable Side Panel**: Quick stats with option to expand for detailed analysis
- ⚡ **Energy Resources Tracked**: Oil, Natural Gas, Coal, Diesel, Renewables, Nuclear
- 📈 **Historical Data**: Database stores resource data over time for trend analysis
- 🔐 **Secure API Integration**: Protected endpoints with cron job scheduling
- 🚀 **Vercel Optimized**: Built for serverless deployment with Vercel Postgres

## Tech Stack

### Frontend
- **Next.js 15**: React framework with server-side rendering
- **Mapbox GL**: Interactive map visualization
- **Tailwind CSS**: Modern styling
- **Zustand**: State management
- **TypeScript**: Type safety

### Backend
- **Next.js API Routes**: Serverless functions
- **PostgreSQL**: Data persistence with Vercel Postgres
- **Cheerio**: Web scraping
- **Axios**: HTTP client for API integration

### Data Sources
- **IEA** (International Energy Agency): Oil, Gas, Coal reserves
- **EIA** (U.S. Energy Information Administration): Energy production data
- **World Bank**: Renewable energy indicators

### Deployment
- **Vercel**: Hosting and edge functions
- **Vercel Postgres**: Database
- **Vercel Cron Jobs**: Scheduled data updates

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository>
   cd international-energy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following:
   - `NEXT_PUBLIC_MAPBOX_TOKEN`: Get from [Mapbox](https://account.mapbox.com/tokens/)
   - `DATABASE_URL`: Local PostgreSQL connection string (optional for development)

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

### Database Setup

#### Local PostgreSQL

```bash
# Create database
createdb energy_resources

# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/energy_resources"

# Initialize schema
curl -X POST http://localhost:3000/api/db/init
```

#### Vercel Postgres

1. Create a Vercel Postgres database in your Vercel project
2. Copy the connection string to `DATABASE_URL`
3. Deploy to Vercel (schema will auto-initialize)

### Configuring Data Sources

#### 1. Mapbox
- Create account at [mapbox.com](https://account.mapbox.com)
- Generate access token
- Add to `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

#### 2. IEA API (Optional)
- Visit [IEA Data Services](https://www.iea.org/data-and-statistics)
- Register for API access
- Add `IEA_API_KEY` to environment variables

#### 3. EIA API (Optional)
- Register at [EIA OpenData](https://www.eia.gov/opendata/)
- Get free API key
- Add `EIA_API_KEY` to environment variables

#### 4. World Bank (No Key Required)
- Public API available at no cost
- World Bank data is automatically fetched

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
│       ├── scraper/run/     # Trigger data scrapers
│       └── stats/           # Statistics endpoints
├── components/
│   ├── EnergyMap.tsx        # Interactive map component
│   ├── EnergyPanel.tsx      # Expandable side panel
│   └── ...
├── lib/
│   ├── types.ts             # TypeScript interfaces
│   ├── store.ts             # Zustand store
│   ├── data.ts              # Data utilities
│   ├── db.ts                # Database functions
│   └── scrapers/
│       ├── worldbank-scraper.ts
│       ├── eia-scraper.ts
│       ├── iea-scraper.ts
│       └── orchestrator.ts  # Scraper coordinator
├── public/
│   └── countries-data.json  # Sample data
├── next.config.ts
├── tailwind.config.ts
├── vercel.json              # Cron job config
└── package.json
```

## API Endpoints

### GET `/api/countries`
Fetch all countries with their energy resources
```json
{
  "success": true,
  "data": [...],
  "timestamp": "2026-03-09T..."
}
```

### POST `/api/db/init`
Initialize database and load sample data
```json
{
  "success": true,
  "message": "Database initialized with sample data",
  "countriesLoaded": 10
}
```

### POST `/api/scraper/run`
Trigger data scrapers (requires CRON_SECRET header in production)
```bash
curl -X POST http://localhost:3000/api/scraper/run \
  -H "Authorization: Bearer your_cron_secret"
```

Response:
```json
{
  "success": true,
  "recordsUpdated": 150,
  "errors": [],
  "timestamp": "2026-03-09T..."
}
```

## Data Scraping Strategy

### Scheduled Updates
- **Frequency**: Every 12 hours (configurable in `vercel.json`)
- **Orchestration**: Runs all scrapers in parallel
- **Error Handling**: Logs failures and continues with other sources
- **Database**: Stores historical data for trend analysis

### Manual Scraping
```bash
# Trigger scraper manually
npm run scrape

# Or via API
curl -X POST http://localhost:3000/api/scraper/run \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Database Schema

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

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Import project at [vercel.com/new](https://vercel.com/new)
   - Select GitHub repository

3. **Set Environment Variables**
   - Add all variables from `.env.example`
   - Create Vercel Postgres database
   - Copy `POSTGRES_URL_NO_SSL` to `DATABASE_URL`

4. **Deploy**
   - Vercel automatically deploys on push
   - Cron jobs run on schedule (every 12 hours)

5. **Initialize Database** (first time)
   - Call `/api/db/init` after deployment
   - Or run: `curl https://your-domain.vercel.app/api/db/init`

## Customization

### Add New Energy Sources
1. Create scraper in `lib/scrapers/your-source.ts`
2. Export function with `Promise<Map<string, any>>` signature
3. Add to orchestrator in `lib/scrapers/orchestrator.ts`

### Modify Map Appearance
- Edit `components/EnergyMap.tsx` for marker styles
- Update Mapbox style in initialization
- Add custom popups or tooltips

### Change Data Update Frequency
- Edit `vercel.json` cron schedule
- Format: `"0 */12 * * *"` (every 12 hours)
- Use [crontab.guru](https://crontab.guru) for schedule help

### Add More Statistics
- Extend `lib/types.ts` with new resource types
- Update database schema
- Modify scraper parsers
- Update UI in `EnergyPanel.tsx`

## Performance Optimization

- **ISR (Incremental Static Regeneration)**: Pages revalidate every hour
- **API Caching**: Next.js caches API responses
- **Database Indexing**: Queries indexed by country and timestamp
- **Lazy Loading**: Map loads asynchronously
- **Image Optimization**: Vercel image optimization

## Monitoring & Logging

Monitor data scraping and performance:

```bash
# View logs in Vercel
vercel logs

# Check scrape logs in database
SELECT * FROM scrape_logs ORDER BY created_at DESC LIMIT 20;

# Monitor energy resources updates
SELECT country_id, COUNT(*) as records FROM energy_resources
GROUP BY country_id ORDER BY records DESC;
```

## Troubleshooting

### Mapbox Token Issues
```
Error: "Mapbox token not found"
→ Set NEXT_PUBLIC_MAPBOX_TOKEN in environment
→ Token must be public (starts with pk.)
```

### Database Connection Errors
```
Error: "connect ENOENT /var/run/postgresql"
→ Ensure PostgreSQL is running locally
→ Or use Vercel Postgres with DATABASE_URL
```

### Scraper Failures
- Check logs: `SELECT * FROM scrape_logs WHERE status='failed'`
- Verify API keys are set
- Check API rate limits
- Review error messages in logs

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
- Documentation: See docs/ folder
- Email: support@example.com

## Future Enhancements

- [ ] User authentication and saved preferences
- [ ] Export data as CSV/JSON
- [ ] Historical trend charts
- [ ] Alerts for resource price changes
- [ ] Mobile app version
- [ ] Advanced filtering and search
- [ ] Comparative analysis tools
- [ ] API for third-party integrations
