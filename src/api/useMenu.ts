import { useQuery } from "@tanstack/react-query";
import { fetchMenu } from "./menu";

export function useMenu() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: ({ signal }) => fetchMenu(signal),
    staleTime: 30_000,
    retry: 2,
  });
}
