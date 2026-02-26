import { db } from "@visyx/db/client";
import { branches } from "@visyx/db/schema";
import { desc, eq } from "drizzle-orm";
import type {
  CreateBranchInput,
  ListBranchesInput,
  UpdateBranchInput,
} from "./schemas";

export class BranchesService {
  /**
   * Fetches a list of branches from the database.
   * By default, it only returns active branches.
   *
   * @param input List configuration (e.g., whether to include inactive branches)
   * @returns Array of branch objects
   *
   * @example
   * ```ts
   * const activeBranches = await trpc.branches.list.query({});
   * const allBranches = await trpc.branches.list.query({ includeInactive: true });
   * ```
   */
  async listBranches(input: ListBranchesInput) {
    const query = db.select().from(branches).orderBy(desc(branches.createdAt));

    if (!input.includeInactive) {
      query.where(eq(branches.isActive, true));
    }

    return await query;
  }

  /**
   * Fetches a single branch by its ID.
   * This is accessible to anyone with `branches:view` permission.
   *
   * @param id The ID of the branch to retrieve
   * @returns The branch object, or undefined if not found
   *
   * @example
   * ```ts
   * const branch = await trpc.branches.get.query({ id: 1 });
   * ```
   */
  async getBranch(id: number) {
    const results = await db
      .select()
      .from(branches)
      .where(eq(branches.id, id))
      .limit(1);

    return results[0];
  }

  /**
   * Creates a new clinic branch.
   * Requires `branches:manage` permission.
   *
   * @param input The branch details (name required, others optional)
   * @returns The newly created branch object
   *
   * @example
   * ```ts
   * const newBranch = await trpc.branches.create.mutate({
   *   name: "Great Batian - Nyeri Town",
   *   phone: "+254700000000"
   * });
   * ```
   */
  async createBranch(input: CreateBranchInput) {
    const results = await db
      .insert(branches)
      .values({
        ...input,
        // Replace empty strings with null for optional fields to keep DB clean
        email: input.email === "" ? null : input.email,
      })
      .returning();

    return results[0];
  }

  /**
   * Updates an existing branch's general information.
   * Note: This mutation cannot be used to reactivate a branch or change its active status.
   * Requires `branches:manage` permission.
   *
   * @param input The updated branch details (id required)
   * @returns The updated branch object
   *
   * @example
   * ```ts
   * const updated = await trpc.branches.update.mutate({
   *   id: 1,
   *   name: "Updated Branch Name"
   * });
   * ```
   */
  async updateBranch(input: UpdateBranchInput) {
    const { id, ...data } = input;

    // Convert empty strings to null for clean DB representation
    const updateData = {
      ...data,
      email: data.email === "" ? null : data.email,
      updatedAt: new Date(),
    };

    const results = await db
      .update(branches)
      .set(updateData)
      .where(eq(branches.id, id))
      .returning();

    return results[0];
  }

  /**
   * Deactivates a branch (soft delete).
   * It sets the `isActive` flag to false.
   * Requires `branches:manage` permission.
   *
   * @param id The ID of the branch to deactivate
   * @returns The deactivated branch object
   *
   * @example
   * ```ts
   * await trpc.branches.deactivate.mutate({ id: 1 });
   * ```
   */
  async deactivateBranch(id: number) {
    const results = await db
      .update(branches)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, id))
      .returning();

    return results[0];
  }
}

export const branchesService = new BranchesService();
