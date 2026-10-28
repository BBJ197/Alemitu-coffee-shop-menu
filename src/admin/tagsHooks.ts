import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expireIfUnauthorized } from "./hooks";
import {
  createTag,
  deleteTag,
  fetchAdminTags,
  reorderTags,
  updateTag,
  type AdminTag,
  type NewTagPayload,
  type RenameTagPayload,
} from "./tagsApi";

export const tagsQueryKey = ["admin", "tags"] as const;

export function useAdminTags() {
  return useQuery({
    queryKey: tagsQueryKey,
    queryFn: ({ signal }) => fetchAdminTags(signal),
    retry: false,
  });
}

function refresh(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: tagsQueryKey });
  // The public menu and the item form's tag checkboxes read the public menu.
  void queryClient.invalidateQueries({ queryKey: ["menu"] });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NewTagPayload) => createTag(payload),
    onSuccess: () => refresh(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useRenameTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { id: string; payload: RenameTagPayload }) =>
      updateTag(values.id, values.payload),
    onSuccess: () => refresh(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useReorderTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reorderTags(ids),
    onSuccess: (list) => {
      if (list) queryClient.setQueryData<AdminTag[]>(tagsQueryKey, list);
      refresh(queryClient);
    },
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => refresh(queryClient),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}
