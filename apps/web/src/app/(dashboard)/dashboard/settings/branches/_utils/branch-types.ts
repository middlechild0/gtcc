"use client";

import type { RouterOutputs } from "@/trpc/client";

export type Branch = RouterOutputs["branches"]["list"][number];
