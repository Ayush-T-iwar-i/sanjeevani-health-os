import { Request, Response } from 'express';
import * as referralService from './referral.service';

export async function postCreate(req: Request, res: Response) {
  try {
    const { patientId, sourceFacilityId, targetFacilityId, referringDoctorId, reason, recommendedSpecialty, priority, dueInHours } =
      req.body;

    if (!patientId || !targetFacilityId || !referringDoctorId || !reason) {
      return res.status(400).json({ error: 'patientId, targetFacilityId, referringDoctorId, and reason are required' });
    }

    const referral = await referralService.createReferral({
      patientId,
      sourceFacilityId,
      targetFacilityId,
      referringDoctorId,
      reason,
      recommendedSpecialty,
      priority,
      dueInHours,
    });

    return res.status(201).json(referral);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create referral', detail: (err as Error).message });
  }
}

export async function getStatus(req: Request, res: Response) {
  const referral = await referralService.getReferralStatus(req.params.id);
  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  return res.status(200).json(referral);
}

export async function getForPatient(req: Request, res: Response) {
  const referrals = await referralService.listReferralsForPatient(req.params.patientId);
  return res.status(200).json({ referrals });
}

export async function getForFacility(req: Request, res: Response) {
  const status = req.query.status as any;
  const referrals = await referralService.listReferralsForFacility(req.params.facilityId, status);
  return res.status(200).json({ referrals });
}

export async function patchStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    if (!['INITIATED', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'NO_SHOW'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const referral = await referralService.updateReferralStatus(req.params.id, status);
    if (!referral) return res.status(404).json({ error: 'Referral not found' });
    return res.status(200).json(referral);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update referral', detail: (err as Error).message });
  }
}
