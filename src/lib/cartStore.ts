'use client';

import { CartItem } from '@/types';

const CART_STORAGE_KEY = 'nord_cafe_cart';

export function getStoredCart(slug: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${CART_STORAGE_KEY}_${slug}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredCart(slug: string, cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CART_STORAGE_KEY}_${slug}`, JSON.stringify(cart));
  } catch {}
}

export function clearStoredCart(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${CART_STORAGE_KEY}_${slug}`);
  } catch {}
}
