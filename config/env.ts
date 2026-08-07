export default function getEnvVariable(name: string): string {
  const value = process.env[name];
  return value!;
}

export const AWS_REGION = getEnvVariable("AWS_REGION");
export const SES_ACCESS_KEY_ID = getEnvVariable("ACCESS_KEY");
export const SES_AWS_SECRET_ACCESS_KEY = getEnvVariable("SECRET_KEY");   
export const DATABASE_URL = getEnvVariable("DATABASE_URL");
export const ACCESS_KEY_ID = getEnvVariable("ACCESS_KEY");
export const COGNITO_CLIENT_ID = getEnvVariable("COGNITO_CLIENT_ID");
export const COGNITO_CLIENT_SECRET = getEnvVariable("COGNITO_CLIENT_SECRET");
export const USER_POOL_ID = getEnvVariable("USER_POOL_ID");
export const AWS_SECRET_ACCESS_KEY = getEnvVariable("SECRET_KEY");
