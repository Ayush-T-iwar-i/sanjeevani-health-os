import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Referral extends Model {
  static table = 'referrals';

  @text('server_id') serverId!: string | null;
  @text('patient_local_id') patientLocalId!: string;
  @text('reason') reason!: string;
  @text('priority') priority!: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  @text('status') status!: string;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}
