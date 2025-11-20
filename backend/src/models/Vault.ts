import { v4 as uuidv4 } from 'uuid';

export interface VaultData {
  id?: string;
  owner: string;
  walrus_blob_id: string;
  created_at?: Date;
  updated_at?: Date;
  total_entries: number;
  is_locked: boolean;
}

export class Vault {
  public id: string;
  public owner: string;
  public walrus_blob_id: string;
  public created_at: Date;
  public updated_at: Date;
  public total_entries: number;
  public is_locked: boolean;

  constructor(data: VaultData) {
    this.id = data.id || uuidv4();
    this.owner = data.owner;
    this.walrus_blob_id = data.walrus_blob_id;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.total_entries = data.total_entries;
    this.is_locked = data.is_locked;
  }

  public toJSON() {
    return {
      id: this.id,
      owner: this.owner,
      walrus_blob_id: this.walrus_blob_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      total_entries: this.total_entries,
      is_locked: this.is_locked,
    };
  }

  public lock() {
    this.is_locked = true;
    this.updated_at = new Date();
  }

  public unlock() {
    this.is_locked = false;
    this.updated_at = new Date();
  }

  public incrementEntries() {
    this.total_entries += 1;
    this.updated_at = new Date();
  }

  public static fromJSON(data: any): Vault {
    return new Vault({
      id: data.id,
      owner: data.owner,
      walrus_blob_id: data.walrus_blob_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      total_entries: data.total_entries,
      is_locked: data.is_locked,
    });
  }
}

export default Vault;