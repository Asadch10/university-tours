-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "accent" TEXT,
ADD COLUMN     "blurb" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tours_from_cents" INTEGER;
