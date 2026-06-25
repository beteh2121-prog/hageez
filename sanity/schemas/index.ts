import type { SchemaTypeDefinition } from 'sanity';
import post from './post';
import author from './author';
import { richTextBody, richTextBlockTypes } from './blocks/richTextBody';

export const schemaTypes: SchemaTypeDefinition[] = [post, author, richTextBody, ...richTextBlockTypes];
