-- 1. Временно отвязываем внешний ключ транзакций
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_programId_fkey";

-- (дальше идут твои существующие команды из файла: DROP INDEX "wash_programs_id_key"; ALTER TABLE "wash_programs" ADD CONSTRAINT "wash_programs_pkey" PRIMARY KEY ("id"); CREATE TABLE "program_consumables" ... и т.д.)



-- DropIndex
DROP INDEX IF EXISTS "wash_programs_id_key" CASCADE;

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
-- 2. В самом конце файла возвращаем внешний ключ транзакций на место
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "wash_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;