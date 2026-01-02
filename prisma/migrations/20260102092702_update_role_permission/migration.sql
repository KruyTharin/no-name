/*
  Warnings:

  - Changed the type of `resource` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `action` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "role_permissions" DROP COLUMN "resource",
ADD COLUMN     "resource" "Resource" NOT NULL,
DROP COLUMN "action",
ADD COLUMN     "action" "Action" NOT NULL;

-- CreateIndex
CREATE INDEX "role_permissions_resource_action_idx" ON "role_permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_resource_action_key" ON "role_permissions"("roleId", "resource", "action");
