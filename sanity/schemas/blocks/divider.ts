import { defineType } from 'sanity';

export default defineType({
  name: 'divider',
  title: 'Divider',
  type: 'object',
  fields: [],
  preview: {
    prepare() {
      return { title: '— Divider —' };
    },
  },
});
