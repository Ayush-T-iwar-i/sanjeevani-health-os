import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Patient extends Model {
  static table = 'patients';

  @text('server_id') serverId!: string | null;
  @text('name') name!: string;
  @text('phone') phone!: string;
  @text('blood_type') bloodType!: string | null;
  @text('allergies') allergiesJson!: string | null;
  @text('chronic_conditions') chronicConditionsJson!: string | null;
  @field('is_pregnant') isPregnant!: boolean | null;
  @field('synced') synced!: boolean;
  @readonly @date('updated_at') updatedAt!: Date;

  get allergies(): string[] {
    return this.allergiesJson ? JSON.parse(this.allergiesJson) : [];
  }

  get chronicConditions(): string[] {
    return this.chronicConditionsJson ? JSON.parse(this.chronicConditionsJson) : [];
  }
}
