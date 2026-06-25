import { defineArrayMember, defineType } from 'sanity';
import imageBlock from './imageBlock';
import youtubeEmbed from './youtubeEmbed';
import audioEmbed from './audioEmbed';
import calloutBox from './calloutBox';
import kdpBookEmbed from './kdpBookEmbed';
import divider from './divider';
import tableBlock from './tableBlock';

export const richTextBody = defineType({
  name: 'richTextBody',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Blockquote', value: 'blockquote' },
        { title: 'Pull Quote', value: 'pullQuote' },
        { title: 'Caption', value: 'caption' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Underline', value: 'underline' },
          { title: 'Strikethrough', value: 'strike-through' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              { name: 'url', title: 'URL', type: 'url' },
              { name: 'openInNewTab', title: 'Open in new tab', type: 'boolean', initialValue: true },
              { name: 'noFollow', title: 'No Follow', type: 'boolean', initialValue: false },
            ],
          },
          {
            name: 'highlight',
            title: 'Highlight',
            type: 'object',
            fields: [
              {
                name: 'color',
                title: 'Color',
                type: 'string',
                options: { list: ['gold', 'cream', 'none'] },
                initialValue: 'none',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'imageBlock' }),
    defineArrayMember({ type: 'youtubeEmbed' }),
    defineArrayMember({ type: 'audioEmbed' }),
    defineArrayMember({ type: 'calloutBox' }),
    defineArrayMember({ type: 'kdpBookEmbed' }),
    defineArrayMember({ type: 'divider' }),
    defineArrayMember({ type: 'tableBlock' }),
  ],
});

export const richTextBlockTypes = [
  imageBlock,
  youtubeEmbed,
  audioEmbed,
  calloutBox,
  kdpBookEmbed,
  divider,
  tableBlock,
];
