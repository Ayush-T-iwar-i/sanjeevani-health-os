import { Request, Response } from 'express';
import { z } from 'zod';
import * as userService from './user.service';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await userService.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const input = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      preferredLanguage: z.string().optional(),
      dob: z.string().optional(),
    }).parse(req.body);

    const user = await userService.updateUser(req.user!.userId, input);
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    res.status(400).json({ error: message });
  }
}

export async function listFacilityStaff(req: Request, res: Response): Promise<void> {
  try {
    const facilityId = req.params.facilityId;
    const role = req.query.role as string | undefined;
    const users = await userService.listUsersByFacility(facilityId, role);
    res.json({ users });
  } catch {
    res.status(500).json({ error: 'Failed to list staff' });
  }
}
