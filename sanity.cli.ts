import { defineCliConfig } from 'sanity/cli';

// Used by the Sanity CLI (`sanity deploy`) to know which project/dataset
// to deploy the Studio to. Runs in .github/workflows/deploy-sanity-studio.yml,
// not on your own machine.
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  },
});
