import Image from 'next/image';
import type { PortableTextComponents } from '@portabletext/react';
import { urlFor } from '@/lib/sanity/image';
import AffiliateButton from '@/features/books/components/AffiliateButton';
import type { KdpBook } from '@/types';

interface SanityImageRef {
  asset?: { _ref: string; _type: string };
}

interface ImageBlockValue {
  image?: SanityImageRef;
  alt?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'full';
  alignment?: 'left' | 'center' | 'right';
}

interface YoutubeEmbedValue {
  url: string;
  caption?: string;
}

interface AudioEmbedValue {
  audioFile?: { asset?: { url?: string } };
  title: string;
  description?: string;
}

interface CalloutBoxValue {
  type: 'info' | 'warning' | 'quote' | 'tip';
  title?: string;
  body: string;
}

interface KdpBookEmbedValue {
  bookAsin: string;
}

interface TableRow {
  cells: string[];
  isHeader: boolean;
}

interface TableBlockValue {
  caption?: string;
  rows: TableRow[];
}

interface LinkMarkValue {
  url?: string;
  openInNewTab?: boolean;
  noFollow?: boolean;
}

interface HighlightMarkValue {
  color?: 'gold' | 'cream' | 'none';
}

const IMAGE_SIZE_CLASSES: Record<string, string> = {
  small: 'max-w-[40%]',
  medium: 'max-w-[70%]',
  full: 'w-full',
};

const IMAGE_ALIGNMENT_CLASSES: Record<string, string> = {
  left: 'float-left mr-4',
  right: 'float-right ml-4',
  center: 'mx-auto',
};

const CALLOUT_STYLES: Record<CalloutBoxValue['type'], string> = {
  info: 'bg-blue-50 border-blue-400',
  warning: 'bg-amber-50 border-amber-400',
  quote: 'bg-cream border-gold',
  tip: 'bg-green-50 border-green-400',
};

function extractYoutubeId(url: string): string | null {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([\w-]+)/);
  if (watchMatch?.[1]) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (shortMatch?.[1]) return shortMatch[1];
  return null;
}

function extractBlockText(children: unknown): string {
  if (!Array.isArray(children)) return '';
  return children
    .map((child) => {
      if (typeof child === 'object' && child !== null && 'text' in child) {
        const text = (child as { text?: unknown }).text;
        return typeof text === 'string' ? text : '';
      }
      return '';
    })
    .join('');
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Builds the Portable Text renderer for blog posts. Takes a pre-fetched
 * map of ASIN -> KdpBook so kdpBookEmbed can render synchronously without
 * an async component (which third-party PortableText typings don't model
 * cleanly) and without an extra database round trip per embed.
 */
export function createPortableTextComponents(bookMap: Record<string, KdpBook>): PortableTextComponents {
  return {
    block: {
      h2: ({ children, value }) => (
        <h2
          id={slugifyHeading(extractBlockText(value.children))}
          className="mb-4 mt-8 font-serif text-2xl font-semibold text-brown"
        >
          {children}
        </h2>
      ),
      h3: ({ children, value }) => (
        <h3
          id={slugifyHeading(extractBlockText(value.children))}
          className="mb-3 mt-6 font-serif text-xl font-semibold text-brown"
        >
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mb-2 mt-4 font-serif text-lg font-semibold text-brown-light">{children}</h4>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-gold pl-4 italic text-charcoal/70">{children}</blockquote>
      ),
      normal: ({ children }) => <p className="mb-4 leading-relaxed text-charcoal">{children}</p>,
    },
    marks: {
      link: ({ children, value }) => {
        const linkValue = value as LinkMarkValue | undefined;
        return (
          <a
            href={linkValue?.url}
            target={linkValue?.openInNewTab === false ? undefined : '_blank'}
            rel={linkValue?.noFollow ? 'nofollow noopener noreferrer' : 'noopener noreferrer'}
            className="text-gold underline"
          >
            {children}
          </a>
        );
      },
      highlight: ({ children, value }) => {
        const highlightValue = value as HighlightMarkValue | undefined;
        const colorClass =
          highlightValue?.color === 'gold'
            ? 'bg-gold/20'
            : highlightValue?.color === 'cream'
              ? 'bg-cream-dark'
              : '';
        return <span className={colorClass}>{children}</span>;
      },
    },
    types: {
      imageBlock: ({ value }: { value: ImageBlockValue }) => {
        if (!value.image?.asset) return null;
        return (
          <figure
            className={`${IMAGE_SIZE_CLASSES[value.size ?? 'full']} ${IMAGE_ALIGNMENT_CLASSES[value.alignment ?? 'center']} my-6`}
          >
            <Image
              src={urlFor(value.image).width(1200).url()}
              alt={value.alt ?? ''}
              width={1200}
              height={800}
              sizes="(max-width: 768px) 100vw, 800px"
              className="w-full rounded-brand-md"
            />
            {value.caption && (
              <figcaption className="mt-2 text-center text-sm italic text-gold">{value.caption}</figcaption>
            )}
          </figure>
        );
      },
      youtubeEmbed: ({ value }: { value: YoutubeEmbedValue }) => {
        const videoId = extractYoutubeId(value.url);
        if (!videoId) return null;
        return (
          <figure className="my-6">
            <div className="aspect-video overflow-hidden rounded-brand-md">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                className="h-full w-full"
                allowFullScreen
              />
            </div>
            {value.caption && <figcaption className="mt-2 text-sm italic text-gold">{value.caption}</figcaption>}
            <p className="mt-1 text-xs text-charcoal/40">Video hosted by YouTube</p>
          </figure>
        );
      },
      audioEmbed: ({ value }: { value: AudioEmbedValue }) => (
        <div className="my-6 rounded-brand-md border border-gold/30 bg-cream-dark p-4">
          <p className="font-serif text-base text-brown">{value.title}</p>
          {value.description && <p className="mt-1 text-sm text-charcoal/60">{value.description}</p>}
          <audio controls preload="metadata" className="mt-3 w-full">
            {value.audioFile?.asset?.url && <source src={value.audioFile.asset.url} />}
          </audio>
        </div>
      ),
      calloutBox: ({ value }: { value: CalloutBoxValue }) => (
        <div className={`my-6 border-l-4 p-4 ${CALLOUT_STYLES[value.type]}`}>
          {value.title && <p className="mb-1 font-serif font-semibold text-brown">{value.title}</p>}
          <p className={value.type === 'quote' ? 'font-serif italic text-brown' : 'text-charcoal/80'}>
            {value.body}
          </p>
        </div>
      ),
      kdpBookEmbed: ({ value }: { value: KdpBookEmbedValue }) => {
        const book = bookMap[value.bookAsin];
        if (!book) {
          return <p className="text-xs text-gray-400">Book currently unavailable</p>;
        }
        return (
          <div className="my-6 flex gap-4 rounded-brand-md border border-gold/20 bg-cream-dark p-4">
            {book.cover_image_url && (
              <Image
                src={book.cover_image_url}
                alt={book.title}
                width={80}
                height={120}
                className="h-[120px] w-[80px] rounded-brand object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <p className="font-serif text-base text-brown">{book.title}</p>
              <p className="text-sm text-charcoal/60">by {book.author}</p>
              <AffiliateButton book={book} size="sm" />
            </div>
          </div>
        );
      },
      divider: () => <hr className="gold-divider" />,
      tableBlock: ({ value }: { value: TableBlockValue }) => (
        <div className="my-6 overflow-x-auto">
          {value.caption && <p className="mb-2 text-sm italic text-charcoal/60">{value.caption}</p>}
          <table className="w-full border border-gray-200">
            <tbody>
              {value.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={row.isHeader ? 'bg-brown text-cream' : rowIndex % 2 === 0 ? 'bg-gray-50' : ''}
                >
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`border border-gray-200 px-3 py-2 ${row.isHeader ? 'font-bold' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  };
}
