export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_TITLE = "TaskFlow — Your Team's Work, Finally in One Place";
export const SITE_DESCRIPTION =
  "TaskFlow is the project management app for small teams. Boards, timelines, chat and automations in one clean workspace. Start your 14-day free trial.";

export const COPYRIGHT_YEAR = 2026;
