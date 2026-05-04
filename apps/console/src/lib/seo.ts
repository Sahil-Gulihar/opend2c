export const SITE_NAME = "Open D2C";
export const SITE_URL = process.env.SITE_URL || "https://graycup.org";

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
      " Explore global sourcing, exports, wholesale and retail coffee, tea and spices from Open D2C."
    );
  }
  return text;
}
