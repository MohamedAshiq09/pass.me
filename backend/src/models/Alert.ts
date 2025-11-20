import { v4 as uuidv4 } from 'uuid';

export interface AlertData {
  id?: string;
  vault_id: string;
  type: 'login_attempt' | 'suspicious_activity' | 'password_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: any;
  read?: boolean;
  created_at?: Date;
}

export class Alert {
  public id: string;
  public vault_id: string;
  public type: 'login_attempt' | 'suspicious_activity' | 'password_breach' | 'unauthorized_access';
  public severity: 'low' | 'medium' | 'high' | 'critical';
  public message: string;
  public metadata: any;
  public read: boolean;
  public created_at: Date;

  constructor(data: AlertData) {
    this.id = data.id || uuidv4();
    this.vault_id = data.vault_id;
    this.type = data.type;
    this.severity = data.severity;
    this.message = data.message;
    this.metadata = data.metadata;
    this.read = data.read || false;
    this.created_at = data.created_at || new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      vault_id: this.vault_id,
      type: this.type,
      severity: this.severity,
      message: this.message,
      metadata: this.metadata,
      read: this.read,
      created_at: this.created_at,
    };
  }

  public markAsRead() {
    this.read = true;
  }

  public static fromJSON(data: any): Alert {
    return new Alert({
      id: data.id,
      vault_id: data.vault_id,
      type: data.type,
      severity: data.severity,
      message: data.message,
      metadata: data.metadata,
      read: data.read,
      created_at: new Date(data.created_at),
    });
  }
}

export default Alert;