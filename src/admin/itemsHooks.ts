import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expireIfUnauthorized } from "./hooks";
import {
  createItem,
  deleteItem,
  fetchAdminCategories,
  fetchAdminItems,
  setItemAvailability,
  updateItem,
  type AdminItem,
  type ItemPayload,
} from "./itemsApi";

export const itemsQueryKey = ["admin", "items"] as const;
export const categoriesQueryKey = ["admin", "categories"] as const;

export function useAdminItems() {
  return useQuery({
    queryKey: itemsQueryKey,
    queryFn: ({ signal }) => fetchAdminItems(signal),
    retry: false,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: ({ signal }) => fetchAdminCategories(signal),
    retry: false,
  });
}

export function useToggleAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { id: string; isAvailable: boolean }) =>
      setItemAvailability(values.id, values.isAvailable),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminItem[]>(itemsQueryKey, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      void queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<AdminItem[]>(itemsQueryKey, (old) =>
        old?.filter((item) => item.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

function refreshAfterSave(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: itemsQueryKey });
  void queryClient.invalidateQueries({ queryKey: ["menu"] });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ItemPayload) => createItem(payload),
    onSuccess: () => refreshAfterSave(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { id: string; payload: ItemPayload }) =>
      updateItem(values.id, values.payload),
    onSuccess: () => refreshAfterSave(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}
