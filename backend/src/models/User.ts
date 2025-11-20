import { v4 as uuidv4 } from 'uuid';

export interface UserData {
  id?: string;
  wallet_address: string;
  vault_id?: string;
  email?: string;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
}

export class User {
  public id: string;
  public wallet_address: string;
  public vault_id?: string;
  public email?: string;
  public created_at: Date;
  public updated_at: Date;
  public last_login?: Date;

  constructor(data: UserData) {
    this.id = data.id || uuidv4();
    this.wallet_address = data.wallet_address;
    this.vault_id = data.vault_id;
    this.email = data.email;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.last_login = data.last_login;
  }

  public toJSON() {
    return {
      id: this.id,
      wallet_address: this.wallet_address,
      vault_id: this.vault_id,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at,
      last_login: this.last_login,
    };
  }

  public updateLastLogin() {
    this.last_login = new Date();
    this.updated_at = new Date();
  }

  public static fromJSON(data: any): User {
    return new User({
      id: data.id,
      wallet_address: data.wallet_address,
      vault_id: data.vault_id,
      email: data.email,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      last_login: data.last_login ? new Date(data.last_login) : undefined,
    });
  }
}

export default User;