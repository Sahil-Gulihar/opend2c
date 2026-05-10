export const SITE_NAME = "Open D2C";
export const SITE_URL = process.env.SITE_URL || "https://opend2c.com";

export function generateTitle(title: string) {
  const full = `${title} | ${SITE_NAME}`;
  if (full.length > 60) {
    return full.slice(0, 57) + "...";
  }
  return full;
}

export function generateDescription(text: string) {
  if (text.length > 160) {
    return text.slice(0, 157) + "...";
  }
  if (text.length < 140) {
    return (
      text +
      " Discover and shop Indian D2C brands — all in one open marketplace."
    );
  }
  return text;
}
