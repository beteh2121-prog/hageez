import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemas';

// This config is used by the standalone Sanity Studio deployment (see
// sanity.cli.ts + .github/workflows/deploy-sanity-studio.yml), not
// embedded in the Next.js app anymore. Embedding Sanity Studio inside
// Next.js bundled the entire Studio framework (~4.7MB gzipped) into the
// Cloudflare Worker, pushing it well over the free tier's 3MB cap.
// Studio now deploys separately to Sanity's own free *.sanity.studio
// hosting, and the Next.js app only imports the lightweight next-sanity
// query client — not the Studio UI framework itself.
export default defineConfig({
  name: 'default',
  title: 'Ethiopian Orthodox Heritage CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
