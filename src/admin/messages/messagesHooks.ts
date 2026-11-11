import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expireIfUnauthorized } from "../hooks";
import { deleteMessage, fetchMessages, setMessageRead } from "./messagesApi";

export const messagesQueryKey = ["admin", "messages"] as const;

export function useMessages() {
  return useQuery({
    queryKey: messagesQueryKey,
    queryFn: ({ signal }) => fetchMessages(signal),
    retry: false,
  });
}

export function useSetMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; isRead: boolean }) =>
      setMessageRead(v.id, v.isRead),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: messagesQueryKey }),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: messagesQueryKey }),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}
