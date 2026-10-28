import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminApiError,
  changePassword,
  fetchSession,
  login,
  logout,
  type AdminSession,
} from "./api";

export const sessionQueryKey = ["admin", "session"] as const;

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
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      changePassword(values.currentPassword, values.newPassword),
    onError: (error) => {
      // The session ran out: send the admin back to the sign-in page.
      if (error instanceof AdminApiError && error.status === 401)
        queryClient.setQueryData(sessionQueryKey, null);
    },
  });
}
