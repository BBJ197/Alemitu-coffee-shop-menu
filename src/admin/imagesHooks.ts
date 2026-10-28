import { useMutation, useQueryClient } from "@tanstack/react-query";
import { prepareImage } from "../lib/imageResize";
import { expireIfUnauthorized } from "./hooks";
import { uploadImage } from "./imagesApi";

/** Resizes and converts the chosen file in the browser, then uploads it. */
export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => uploadImage(await prepareImage(file)),
    onError: (error) => expireIfUnauthorized(queryClient, error),
  });
}
