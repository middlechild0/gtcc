"use client";

import type { RouterOutputs } from "@/trpc/client";

export type Patient = RouterOutputs["patients"]["list"][number];
