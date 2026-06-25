import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'body', title: 'Body', type: 'richTextBody' }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
    defineField({ name: 'published', title: 'Published', type: 'boolean', initialValue: false }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', validation: (rule) => rule.max(200) }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'readingTime', title: 'Reading Time (minutes)', type: 'number' }),
    defineField({
      name: 'tableOfContents',
      title: 'Show Table of Contents',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related Posts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
      validation: (rule) => rule.max(3),
    }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', validation: (rule) => rule.max(60) }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      validation: (rule) => rule.max(160),
    }),
    defineField({ name: 'seoKeywords', title: 'SEO Keywords', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'focusKeyword', title: 'Focus Keyword', type: 'string' }),
    defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
  ],
  preview: {
    select: { title: 'title', media: 'coverImage' },
  },
});
