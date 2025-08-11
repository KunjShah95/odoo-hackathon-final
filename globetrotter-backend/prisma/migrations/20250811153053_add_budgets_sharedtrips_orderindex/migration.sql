-- AlterTable
ALTER TABLE "public"."stops" ADD COLUMN     "order_index" INTEGER;

-- CreateTable
CREATE TABLE "public"."budgets" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "transport_cost" DOUBLE PRECISION NOT NULL,
    "stay_cost" DOUBLE PRECISION NOT NULL,
    "activity_cost" DOUBLE PRECISION NOT NULL,
    "meal_cost" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shared_trips" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "public_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_trips_trip_id_key" ON "public"."shared_trips"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_trips_public_key_key" ON "public"."shared_trips"("public_key");

-- AddForeignKey
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shared_trips" ADD CONSTRAINT "shared_trips_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
