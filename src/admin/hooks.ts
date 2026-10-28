import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  AdminApiError,
  changePassword,
  fetchSession,
  login,
  logout,
  type AdminSession,
} from "./api";

export const sessionQueryKey = ["admin", "session"] as const;

/** A 401 from any admin call means the session ended: send the admin back to sign-in. */
export function expireIfUnauthorized(queryClient: QueryClient, error: unknown) {
  if (error instanceof AdminApiError && error.status === 401)
    queryClient.setQueryData(sessionQueryKey, null);
}

export function useExpireOnUnauthorized(error: unknown) {
  const queryClient = useQueryClient();
  useEffect(() => {
    expireIfUnauthorized(queryClient, error);
  }, [queryClient, error]);
}

export function useAdminSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      login(credentials.email, credentials.password),
    onSuccess: (session: AdminSession) => {
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      // Drop cached admin data (items, categories) along with the session.
      queryClient.removeQueries({
        predicate: (q) =>
          q.queryKey[0] === "admin" && q.queryKey[1] !== "session",
      });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      changePassword(values.currentPassword, values.newPassword),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}
