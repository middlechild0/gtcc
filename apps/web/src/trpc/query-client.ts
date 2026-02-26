import {
  defaultShouldDehydrateQuery,
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import superjson from "superjson";

function handleGlobalError(error: unknown) {
  // If the user is entirely offline, the NetworkStatus banner handles it
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }

  if (error instanceof TRPCClientError) {
    // Determine if it was a network failure or a 50x server level rejection
    const isNetworkError =
      error.message.includes("Failed to fetch") ||
      error.message.includes("fetch failed");

    // Sometimes TRPC HTTP failures come wrapped with a status code representation
    const isServerUnreachable =
      isNetworkError ||
      error.data?.httpStatus === 502 ||
      error.data?.httpStatus === 503 ||
      error.data?.httpStatus === 504;

    if (isServerUnreachable) {
      toast.error("Server is currently unreachable", {
        description: "Please check your connection or try again later.",
        id: "server-unreachable", // Deduplicate identical toasts (e.g., from retries or parallel fetches)
      });
    }
  }
}

export function makeQueryClient() {
  return new QueryClient({
    // Intercept errors globally to avoid silent fetch failures or localized component crashes
    queryCache: !isServer
      ? new QueryCache({
          onError: handleGlobalError,
        })
      : undefined,
    mutationCache: !isServer
      ? new MutationCache({
          onError: handleGlobalError,
        })
      : undefined,
    defaultOptions: {
      queries: {
        // Default staleTime of 2 minutes - queries won't refetch if data is fresh
        // For static data (user settings, team config), override with longer staleTime (5+ min)
        staleTime: 2 * 60 * 1000,
        // Keep unused data in cache for 10 minutes before garbage collection
        gcTime: 10 * 60 * 1000,
        // On the server, limit retries to 1 so fetchQuery/prefetchQuery fail
        // fast (prevents 3× exponential-backoff delays that stall SSR).
        // On the client, allow 2 retries for resilience against transient
        // network hiccups (mobile, slow connections, etc.).
        retry: isServer ? 1 : 2,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
