CREATE UNIQUE INDEX "visits_one_active_per_patient_branch_idx"
  ON "visits" ("patient_id", "branch_id")
  WHERE "status" IN ('WAITING', 'IN_PROGRESS', 'ON_HOLD');