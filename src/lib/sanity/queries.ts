import { sanityClient } from './client';
import type { SanityPost } from '@/types';

const postFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  "coverImage": coverImage.asset->url,
  publishedAt,
  tags,
  readingTime,
  tableOfContents,
  "author": author->{ _id, name, "image": image.asset->url, bio },
  seoTitle,
  seoDescription,
  "ogImage": ogImage.asset->url
`;

export async function getAllPosts(): Promise<SanityPost[]> {
  const query = `*[_type == "post" && published == true] | order(publishedAt desc) {
    ${postFields}
  }`;
  return sanityClient.fetch<SanityPost[]>(query);
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    ${postFields},
    body,
    "relatedPosts": relatedPosts[]->{ title, "slug": slug.current }
  }`;
  return sanityClient.fetch<SanityPost | null>(query, { slug });
}

export async function getFeaturedPosts(): Promise<SanityPost[]> {
  const query = `*[_type == "post" && published == true] | order(publishedAt desc) [0...3] {
    ${postFields}
  }`;
  return sanityClient.fetch<SanityPost[]>(query);
}

export async function getAllTags(): Promise<string[]> {
  const query = `array::unique(*[_type == "post" && published == true].tags[])`;
  return sanityClient.fetch<string[]>(query);
}
