import { defineField, defineType } from 'sanity';

// Sanity v3 requires every object type to have at least one field.
// We add a 'style' field so the schema is valid, while still keeping
// the divider block simple and fast to insert.
export default defineType({
  name: 'divider',
  title: 'Divider',
  type: 'object',
  fields: [
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: { list: [{ title: 'Gold', value: 'gold' }, { title: 'Simple', value: 'simple' }] },
      initialValue: 'gold',
    }),
  ],
  preview: {
    select: { style: 'style' },
    prepare({ style }: { style?: string }) {
      return { title: style === 'simple' ? '— Simple Divider —' : '— Gold Divider —' };
    },
  },
});
