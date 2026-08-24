export interface OAuthClient {
  id: string;
  client_secret_hash: string;
  client_name: string;
  redirect_uris: string[];
  scopes: string;
  is_trusted: boolean;
  created_at: string;
  updated_at: string;
}

export interface OAuthCodeData {
  code: string;
  client_id: string;
  user_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: "S256" | "plain";
  created_at: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  id_token?: string;
  scope: string;
}

export interface OIDCDiscoveryConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  claims_supported: string[];
  code_challenge_methods_supported: string[];
}

export interface OIDCUserInfo {
  sub: string;
  id: string;
  name: string;
  preferred_username: string;
  email: string;
  email_verified: boolean;
  role: string;
  display_name: string;
}
