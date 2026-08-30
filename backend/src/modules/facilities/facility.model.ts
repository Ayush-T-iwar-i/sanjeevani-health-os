export interface HealthFacility {
  facility_id: string;
  name: string;
  type: string;
  location: { lat: number; lng: number } | null;
  services_offered: string[];
  contact_info: Record<string, string>;
  distance_km?: number;
}

export interface FacilitySearchParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  service?: string;
  type?: string;
  query?: string;
}
