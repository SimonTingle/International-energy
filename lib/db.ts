import { Pool } from "pg";

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    // Create countries table
    await query(`
      CREATE TABLE IF NOT EXISTS countries (
        id VARCHAR(2) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        region VARCHAR(50) NOT NULL,
        coordinates POINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create energy resources table
    await query(`
      CREATE TABLE IF NOT EXISTS energy_resources (
        id SERIAL PRIMARY KEY,
        country_id VARCHAR(2) REFERENCES countries(id) ON DELETE CASCADE,
        oil DECIMAL(10, 2),
        gas DECIMAL(12, 2),
        coal DECIMAL(10, 2),
        diesel DECIMAL(10, 2),
        renewables DECIMAL(10, 2),
        nuclear DECIMAL(10, 2),
        source VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_energy_resources_country_timestamp
      ON energy_resources(country_id, timestamp DESC)
    `);

    // Create scrape logs table for tracking data collection
    await query(`
      CREATE TABLE IF NOT EXISTS scrape_logs (
        id SERIAL PRIMARY KEY,
        source VARCHAR(100) NOT NULL,
        status VARCHAR(20),
        records_collected INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function getLatestCountryResources(countryId: string) {
  try {
    const result = await query(
      `
      SELECT * FROM energy_resources
      WHERE country_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `,
      [countryId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching country resources:", error);
    return null;
  }
}

export async function getAllCountriesLatestResources() {
  try {
    const result = await query(`
      SELECT DISTINCT ON (er.country_id)
        er.*, c.name, c.region, c.coordinates
      FROM energy_resources er
      JOIN countries c ON er.country_id = c.id
      ORDER BY er.country_id, er.timestamp DESC
    `);
    return result.rows;
  } catch (error) {
    console.error("Error fetching all countries resources:", error);
    return [];
  }
}

export async function insertCountry(
  id: string,
  name: string,
  region: string,
  coordinates: [number, number]
) {
  try {
    await query(
      `
      INSERT INTO countries (id, name, region, coordinates)
      VALUES ($1, $2, $3, POINT($4, $5))
      ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `,
      [id, name, region, coordinates[0], coordinates[1]]
    );
  } catch (error) {
    console.error("Error inserting country:", error);
    throw error;
  }
}

export async function insertEnergyResources(
  countryId: string,
  resources: {
    oil?: number;
    gas?: number;
    coal?: number;
    diesel?: number;
    renewables?: number;
    nuclear?: number;
  },
  source: string = "scraper"
) {
  try {
    await query(
      `
      INSERT INTO energy_resources
      (country_id, oil, gas, coal, diesel, renewables, nuclear, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        countryId,
        resources.oil || null,
        resources.gas || null,
        resources.coal || null,
        resources.diesel || null,
        resources.renewables || null,
        resources.nuclear || null,
        source,
      ]
    );
  } catch (error) {
    console.error("Error inserting energy resources:", error);
    throw error;
  }
}

export async function logScrapeOperation(
  source: string,
  status: "success" | "failed",
  recordsCollected: number,
  errorMessage?: string
) {
  try {
    await query(
      `
      INSERT INTO scrape_logs (source, status, records_collected, error_message)
      VALUES ($1, $2, $3, $4)
    `,
      [source, status, recordsCollected, errorMessage || null]
    );
  } catch (error) {
    console.error("Error logging scrape operation:", error);
  }
}

export default pool;
