import { RoleType, UserDocument } from '@modules/users/user.schema';
import { Request, Response } from 'express';

export interface HttpContext {
  req: Request;
  res: Response;
}

export interface PayloadUserForJwtToken {
  user: UserFromRequest;
}

export interface DataStoredFromToken {
  user: UserFromRequest;
}

export interface UserFromRequest extends Partial<UserDocument> {
  _id?: string;
  id?: string;
  role?: RoleType;
  email?: string;
  username?: string;
  password?: string;
  thumbnail?: string;
  cart?: any[];
}
export interface SessionAuthToken {
  authToken?: {
    accessToken: string;
    refreshToken: string;
  };
}
