-- DropIndex
DROP INDEX "wash_programs_id_key";

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "expectedCash" INTEGER;

-- AlterTable
ALTER TABLE "wash_programs" ALTER COLUMN "foam_usage" SET DEFAULT 0,
ADD CONSTRAINT "wash_programs_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "program_consumables" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "program_consumables_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "program_consumables" ADD CONSTRAINT "program_consumables_programId_fkey" FOREIGN KEY ("programId") REFERENCES "wash_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_consumables" ADD CONSTRAINT "program_consumables_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
