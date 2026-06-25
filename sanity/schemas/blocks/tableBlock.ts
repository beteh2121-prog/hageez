import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'tableBlock',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'row',
          fields: [
            defineField({ name: 'cells', title: 'Cells', type: 'array', of: [{ type: 'string' }] }),
            defineField({ name: 'isHeader', title: 'Is Header Row', type: 'boolean', initialValue: false }),
          ],
        },
      ],
    }),
  ],
});
