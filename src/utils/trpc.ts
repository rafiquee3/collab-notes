import { AppRouter } from "@/server/index";
import { createTRPCReact } from "@trpc/react-query";

// Path to your backend router
// We create a set of hooks (useQuery, useMutation, etc.) based on the AppRouter type
export const trpc = createTRPCReact<AppRouter>();
