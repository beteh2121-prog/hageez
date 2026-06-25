import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'calloutBox',
  title: 'Callout Box',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: { list: ['info', 'warning', 'quote', 'tip'] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text', validation: (rule) => rule.required() }),
  ],
});
