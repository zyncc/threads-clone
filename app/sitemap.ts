import { type MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  return [{ url: `${baseURL}` }];
}
