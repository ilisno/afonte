// src/integrations/sanity/client.ts
import { createClient } from '@sanity/client';

// Using the project ID and dataset from your Sanity project API page
const projectId = "n5uztn17";
const dataset = "production"; // Assuming 'production' is your dataset name

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2023-09-11', // use a UTC date string
  useCdn: true, // use the CDN for faster responses
});