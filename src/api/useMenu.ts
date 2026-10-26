import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchMenu } from "./menu";

// One quick retry, so a weak connection shows the error state within about two seconds.
export const menuQueryOptions = queryOptions({
  queryKey: ["menu"],
  queryFn: ({ signal }) => fetchMenu(signal),
  staleTime: 30_000,
  retry: 1,
  retryDelay: 700,
});

export function useMenu() {
  return useQuery(menuQueryOptions);
}
