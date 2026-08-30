import { query } from '../../config/db';
import { FacilitySearchParams, HealthFacility } from './facility.model';

interface FacilityRow {
  facility_id: string;
  name: string;
  type: string;
  lat: number | null;
  lng: number | null;
  services_offered: string[];
  contact_info: Record<string, string>;
  distance_km?: number;
}

function mapRow(row: FacilityRow): HealthFacility {
  return {
    facility_id: row.facility_id,
    name: row.name,
    type: row.type,
    location: row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng } : null,
    services_offered: row.services_offered ?? [],
    contact_info: row.contact_info ?? {},
    distance_km: row.distance_km,
  };
}

export async function searchFacilities(params: FacilitySearchParams): Promise<HealthFacility[]> {
  const { lat, lng, radiusKm = 50, service, type, query: textQuery } = params;

  if (lat !== undefined && lng !== undefined) {
    let sql = `
      SELECT f.facility_id, f.name, f.type,
             ST_Y(f.location::geometry) AS lat,
             ST_X(f.location::geometry) AS lng,
             f.services_offered, f.contact_info,
             ST_Distance(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
      FROM health_facilities f
      WHERE f.location IS NOT NULL
        AND ST_DWithin(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)`;

    const sqlParams: unknown[] = [lat, lng, radiusKm];
    let paramIdx = 4;

    if (service) {
      sql += ` AND f.services_offered @> $${paramIdx}::jsonb`;
      sqlParams.push(JSON.stringify([service]));
      paramIdx++;
    }

    if (type) {
      sql += ` AND f.type = $${paramIdx}`;
      sqlParams.push(type);
      paramIdx++;
    }

    if (textQuery) {
      sql += ` AND f.name ILIKE $${paramIdx}`;
      sqlParams.push(`%${textQuery}%`);
      paramIdx++;
    }

    sql += ' ORDER BY distance_km ASC LIMIT 50';

    const result = await query<FacilityRow>(sql, sqlParams);
    return result.rows.map(mapRow);
  }

  let sql = `
    SELECT f.facility_id, f.name, f.type,
           ST_Y(f.location::geometry) AS lat,
           ST_X(f.location::geometry) AS lng,
           f.services_offered, f.contact_info
    FROM health_facilities f WHERE 1=1`;

  const sqlParams: unknown[] = [];
  let paramIdx = 1;

  if (type) {
    sql += ` AND f.type = $${paramIdx}`;
    sqlParams.push(type);
    paramIdx++;
  }

  if (service) {
    sql += ` AND f.services_offered @> $${paramIdx}::jsonb`;
    sqlParams.push(JSON.stringify([service]));
    paramIdx++;
  }

  if (textQuery) {
    sql += ` AND f.name ILIKE $${paramIdx}`;
    sqlParams.push(`%${textQuery}%`);
    paramIdx++;
  }

  sql += ' ORDER BY f.name ASC LIMIT 50';

  const result = await query<FacilityRow>(sql, sqlParams);
  return result.rows.map(mapRow);
}

export async function getFacilityById(facilityId: string): Promise<HealthFacility | null> {
  const result = await query<FacilityRow>(
    `SELECT f.facility_id, f.name, f.type,
            ST_Y(f.location::geometry) AS lat,
            ST_X(f.location::geometry) AS lng,
            f.services_offered, f.contact_info
     FROM health_facilities f WHERE f.facility_id = $1`,
    [facilityId]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function listServices(): Promise<string[]> {
  const result = await query<{ service: string }>(
    `SELECT DISTINCT jsonb_array_elements_text(services_offered) AS service
     FROM health_facilities ORDER BY service`
  );
  return result.rows.map((r) => r.service);
}
