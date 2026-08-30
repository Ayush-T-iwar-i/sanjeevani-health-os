import { Request, Response } from 'express';
import * as facilityService from './facility.service';

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 50;
    const service = req.query.service as string | undefined;
    const type = req.query.type as string | undefined;
    const q = req.query.q as string | undefined;

    const facilities = await facilityService.searchFacilities({
      lat,
      lng,
      radiusKm,
      service,
      type,
      query: q,
    });

    res.json({ facilities, count: facilities.length });
  } catch {
    res.status(500).json({ error: 'Facility search failed' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const facility = await facilityService.getFacilityById(req.params.id);
    if (!facility) {
      res.status(404).json({ error: 'Facility not found' });
      return;
    }
    res.json(facility);
  } catch {
    res.status(500).json({ error: 'Failed to fetch facility' });
  }
}

export async function listServices(req: Request, res: Response): Promise<void> {
  try {
    const services = await facilityService.listServices();
    res.json({ services });
  } catch {
    res.status(500).json({ error: 'Failed to list services' });
  }
}
