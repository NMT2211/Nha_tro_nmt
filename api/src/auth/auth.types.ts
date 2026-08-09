export interface JwtPayload {
  sub: string;
  email: string;
  sessionId: string;
}
export interface RequestMetadata {
  ip?: string;
  userAgent?: string;
}
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
