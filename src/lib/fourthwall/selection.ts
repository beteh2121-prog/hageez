import type { ProductView, VariantView } from '@/lib/fourthwall/product-view';

/** option key → chosen value, e.g. { color: "Terracotta", size: "M" } */
export type Selection = Record<string, string>;

function selectionOf(view: ProductView, variant: VariantView, fallback: Selection = {}): Selection {
  const selection: Selection = {};
  for (const option of view.options) {
    selection[option.key] = variant.optionValues[option.key] ?? fallback[option.key] ?? option.values[0]?.value ?? '';
  }
  return selection;
}

/** Starts on the first variant that can actually be bought. */
export function defaultSelection(view: ProductView): Selection {
  const first = view.variants.find((variant) => variant.available) ?? view.variants[0];
  return first ? selectionOf(view, first) : {};
}

function matchesSelection(view: ProductView, variant: VariantView, selection: Selection, ignoreKey?: string): boolean {
  return view.options.every((option) => {
    if (option.key === ignoreKey) return true;
    const own = variant.optionValues[option.key];
    return !own || own === selection[option.key];
  });
}

export function resolveVariant(view: ProductView, selection: Selection): VariantView | undefined {
  return view.variants.find((variant) => matchesSelection(view, variant, selection)) ?? view.variants[0];
}

/**
 * Chooses a value for one option. If that exact combination doesn't exist,
 * the other options move to the closest variant that does, so a shopper is
 * never stuck on an impossible combination. A combination that exists but is
 * sold out stays selected, so the page can say "Out of stock" honestly.
 */
export function selectOption(view: ProductView, selection: Selection, key: string, value: string): Selection {
  const candidates = view.variants.filter((variant) => variant.optionValues[key] === value);
  if (candidates.length === 0) return selection;

  const best =
    candidates.find((variant) => variant.available && matchesSelection(view, variant, selection, key)) ??
    candidates.find((variant) => matchesSelection(view, variant, selection, key)) ??
    candidates.find((variant) => variant.available) ??
    candidates[0];

  return best ? selectionOf(view, best, selection) : selection;
}

/** An option value is enabled if any variant with it can be bought. */
export function isValueAvailable(view: ProductView, key: string, value: string): boolean {
  return view.variants.some((variant) => variant.optionValues[key] === value && variant.available);
}

/** Only options with a real choice are shown to the shopper. */
export function selectableOptions(view: ProductView) {
  return view.options.filter((option) => option.values.length > 1);
}

export interface ParsedSelection {
  selection: Selection;
  image: number;
}

/** Reads ?color=…&size=…&image=2 (case-insensitive values; junk is ignored). */
export function parseSelection(view: ProductView, search: string): ParsedSelection {
  const params = new URLSearchParams(search);
  let selection = defaultSelection(view);

  for (const option of view.options) {
    const raw = params.get(option.key);
    if (!raw) continue;
    const match = option.values.find((candidate) => candidate.value.toLowerCase() === raw.toLowerCase());
    if (match) selection = selectOption(view, selection, option.key, match.value);
  }

  const imageParam = Number.parseInt(params.get('image') ?? '0', 10);
  return { selection, image: Number.isFinite(imageParam) && imageParam > 0 ? imageParam : 0 };
}

/** Rewrites the query string for the chosen options, keeping unrelated params. */
export function buildSearch(currentSearch: string, view: ProductView, selection: Selection, image: number): string {
  const params = new URLSearchParams(currentSearch);

  for (const option of selectableOptions(view)) {
    const value = selection[option.key];
    if (value) params.set(option.key, value);
  }

  if (image > 0) params.set('image', String(image));
  else params.delete('image');

  const search = params.toString();
  return search ? `?${search}` : '';
}
