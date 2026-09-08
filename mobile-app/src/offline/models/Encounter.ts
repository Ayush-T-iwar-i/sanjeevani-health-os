import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Encounter extends Model {
  static table = 'encounters';

  @text('server_id') serverId!: string | null;
  @text('patient_local_id') patientLocalId!: string;
  @text('triage_category') triageCategory!: 'RED' | 'AMBER' | 'GREEN' | null;
  @text('chief_complaints') chiefComplaintsJson!: string;
  @text('vitals_payload') vitalsPayloadJson!: string;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;

  get chiefComplaints(): string[] {
    return JSON.parse(this.chiefComplaintsJson || '[]');
  }

  get vitals(): Record<string, number> {
    return JSON.parse(this.vitalsPayloadJson || '{}');
  }
}
