import { useEffect, useState } from "react";
import type { Category, Product } from "../data/products";
import { fetchProduct, fetchProducts } from "../lib/api";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useProducts(category?: Category | null) {
  const [state, setState] = useState<AsyncState<Product[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchProducts(category ?? undefined)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return state;
}

export function useProduct(id: string | undefined) {
  const [state, setState] = useState<AsyncState<Product>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetchProduct(id)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
