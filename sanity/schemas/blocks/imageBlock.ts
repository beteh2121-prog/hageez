import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'imageBlock',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'alt', title: 'Alt Text', type: 'string', validation: (rule) => rule.required().min(1) }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: { list: ['small', 'medium', 'full'] },
      initialValue: 'full',
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      options: { list: ['left', 'center', 'right'] },
      initialValue: 'center',
    }),
  ],
  preview: {
    select: { media: 'image', title: 'alt' },
  },
});
