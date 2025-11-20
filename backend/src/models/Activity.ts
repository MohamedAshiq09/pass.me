import { v4 as uuidv4 } from 'uuid';

export interface ActivityData {
  id?: string;
  vault_id: string;
  entry_id?: string;
  action: string;
  device_id: string;
  ip_hash: string;
  metadata: any;
  timestamp?: Date;
}

export class Activity {
  public id: string;
  public vault_id: string;
  public entry_id?: string;
  public action: string;
  public device_id: string;
  public ip_hash: string;
  public metadata: any;
  public timestamp: Date;

  constructor(data: ActivityData) {
    this.id = data.id || uuidv4();
    this.vault_id = data.vault_id;
    this.entry_id = data.entry_id;
    this.action = data.action;
    this.device_id = data.device_id;
    this.ip_hash = data.ip_hash;
    this.metadata = data.metadata;
    this.timestamp = data.timestamp || new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      vault_id: this.vault_id,
      entry_id: this.entry_id,
      action: this.action,
      device_id: this.device_id,
      ip_hash: this.ip_hash,
      metadata: this.metadata,
      timestamp: this.timestamp,
    };
  }

  public static fromJSON(data: any): Activity {
    return new Activity({
      id: data.id,
      vault_id: data.vault_id,
      entry_id: data.entry_id,
      action: data.action,
      device_id: data.device_id,
      ip_hash: data.ip_hash,
      metadata: data.metadata,
      timestamp: new Date(data.timestamp),
    });
  }
}

export default Activity;