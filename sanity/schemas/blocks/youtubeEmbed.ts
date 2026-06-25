import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'youtubeEmbed',
  title: 'YouTube Video',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'string',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true;
          return /youtube\.com|youtu\.be/.test(value) ? true : 'Must be a youtube.com or youtu.be URL';
        }),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
  ],
});
