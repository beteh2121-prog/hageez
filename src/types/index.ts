export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: 'customer' | 'admin' | 'editor';
  created_at: string;
  updated_at: string;
}

export interface MerchImage {
  url: string;
  alt: string;
}

export interface Merch {
  id: string;
  fourthwall_id: string;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  images: MerchImage[];
  tags: string[];
  category: string | null;
  status: 'active' | 'archived' | 'draft';
  featured: boolean;
  stock_count: number | null;
  source: 'manual' | 'fourthwall';
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  og_image_url: string | null;
  focus_keyword: string | null;
  google_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Download {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  file_path: string | null;
  file_type: 'pdf' | 'epub' | 'mp3' | 'video' | null;
  file_size_bytes: number | null;
  price_cents: number;
  preview_url: string | null;
  cover_path: string | null;
  featured: boolean;
  related_merch_id: string | null;
  fourthwall_product_id: string | null;
  gumroad_product_id: string | null;
  source: 'manual' | 'fourthwall' | 'gumroad';
  external_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  og_image_url: string | null;
  focus_keyword: string | null;
  google_category: string | null;
  created_at: string;
  updated_at: string;
}

export type AmazonMarketplace = 'com' | 'co.uk' | 'de' | 'ca' | 'com.au';

export interface KdpBook {
  id: string;
  asin: string;
  title: string;
  subtitle: string | null;
  author: string;
  description: string | null;
  custom_description: string | null;
  cover_image_url: string | null;
  affiliate_tag: string;
  marketplace: AmazonMarketplace;
  price_usd: number | null;
  page_count: number | null;
  published_date: string | null;
  language: string;
  categories: string[];
  tags: string[];
  is_featured: boolean;
  is_published: boolean;
  related_blog_slug: string | null;
  related_merch_id: string | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  og_image_url: string | null;
  focus_keyword: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: string;
  book_id: string;
  user_id: string | null;
  session_id: string | null;
  referrer_url: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  marketplace: AmazonMarketplace;
  clicked_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  user_id: string | null;
  fourthwall_order_id: string | null;
  status: OrderStatus;
  total_cents: number | null;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  line_items: unknown[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadPurchase {
  id: string;
  user_id: string | null;
  download_id: string | null;
  fourthwall_order_id: string | null;
  amount_paid_cents: number | null;
  delivery_email: string;
  delivered_at: string | null;
  pending_delivery_url: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  title: string;
  price_cents: number;
  quantity: number;
  image?: string;
  type: 'merch' | 'download';
}

export interface SanityAuthor {
  _id: string;
  name: string;
  image: string | null;
  bio: string | null;
}

export interface SanityPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: unknown;
  coverImage: string | null;
  publishedAt: string;
  tags: string[];
  author: SanityAuthor | null;
  readingTime: number;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  relatedPosts: { title: string; slug: string }[];
  tableOfContents: boolean;
}

export interface AffiliateStats {
  id: string;
  title: string;
  asin: string;
  author: string;
  total_clicks: number;
  clicks_7d: number;
  clicks_30d: number;
  unique_sessions: number;
}

export interface DashboardStats {
  totalRevenue: number;
  activeProducts: number;
  downloadsSold: number;
  recentOrders: Order[];
  topBooks: AffiliateStats[];
}
