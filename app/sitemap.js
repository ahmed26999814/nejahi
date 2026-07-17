const siteUrl = "https://mauri-results.vercel.app";

export default function sitemap() {
  return [
    { url: siteUrl },
    { url: `${siteUrl}/toppers` },
    { url: `${siteUrl}/statistics` },
    { url: `${siteUrl}/lessons` },
    { url: `${siteUrl}/calculator` },
    { url: `${siteUrl}/results/bac-mauritanie` },
    { url: `${siteUrl}/results/brevet-mauritanie` },
    { url: `${siteUrl}/results/concours-mauritanie` },
    { url: `${siteUrl}/results/excellence-mauritanie` },
  ];
}
