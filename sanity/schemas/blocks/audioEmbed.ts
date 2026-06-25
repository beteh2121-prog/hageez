import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'audioEmbed',
  title: 'Audio',
  type: 'object',
  fields: [
    defineField({
      name: 'audioFile',
      title: 'Audio File',
      type: 'file',
      options: { accept: '.mp3,.wav,.ogg' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
  ],
});
