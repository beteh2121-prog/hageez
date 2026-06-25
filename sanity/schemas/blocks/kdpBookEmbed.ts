import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'kdpBookEmbed',
  title: 'KDP Book Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'bookAsin',
      title: 'Book ASIN',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .regex(/^[A-Z0-9]{10}$/)
          .error('Must be exactly 10 uppercase letters/numbers'),
    }),
  ],
});
