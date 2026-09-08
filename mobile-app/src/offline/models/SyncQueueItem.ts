import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class SyncQueueItem extends Model {
  static table = 'sync_queue';

  @text('mutation_id') mutationId!: string;
  @text('table_name') tableName!: string;
  @text('operation') operation!: string;
  @text('record_id') recordId!: string;
  @text('payload') payload!: string; // JSON string
  @field('client_timestamp') clientTimestamp!: number;
  @field('attempted') attempted!: boolean;
}
