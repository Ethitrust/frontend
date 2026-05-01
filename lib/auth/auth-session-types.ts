/** Shapes from `docs/apidoc.md`: GET `/api/v1/auth/me` */

export type AuthMeRow = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  role: string;
  banned: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
};

/** GET `/api/v1/auth/profile` */

export type AuthProfileRow = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  kyc_status: string;
  created_at: string;
  updated_at: string;
};
