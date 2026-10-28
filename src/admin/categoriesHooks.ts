import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
  type CategoryPayload,
} from "./categoriesApi";
import { expireIfUnauthorized } from "./hooks";
import { categoriesQueryKey } from "./itemsHooks";
import type { AdminCategory } from "./itemsApi";

function refresh(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
  void queryClient.invalidateQueries({ queryKey: ["menu"] });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => refresh(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { id: string; payload: CategoryPayload }) =>
      updateCategory(values.id, values.payload),
    onSuccess: () => refresh(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reorderCategories(ids),
    onSuccess: (list) => {
      if (list)
        queryClient.setQueryData<AdminCategory[]>(categoriesQueryKey, list);
      refresh(queryClient);
    },
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => refresh(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}
