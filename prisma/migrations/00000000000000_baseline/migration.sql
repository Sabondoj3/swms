-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PUBLIC', 'COLLECTOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'COLLECTED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "WasteCategoryEnum" AS ENUM ('PLASTIC', 'PAPER', 'FOOD_ORGANIC', 'METAL', 'GLASS', 'E_WASTE', 'MIXED', 'HAZARDOUS', 'OTHER');

-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('BIN_OVERFLOWING', 'ILLEGAL_DUMPING', 'BIN_DAMAGED', 'MISSED_COLLECTION', 'NO_BIN', 'SCATTERED', 'OTHER');

-- CreateEnum
CREATE TYPE "CollectionPointStatus" AS ENUM ('ACTIVE', 'FULL', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'COLLECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'REPORT_SUBMITTED', 'REPORT_VERIFIED', 'COLLECTOR_ASSIGNED', 'COLLECTION_STARTED', 'WASTE_COLLECTED', 'NEW_ASSIGNMENT', 'ASSIGNMENT_UPDATED', 'ASSIGNMENT_CANCELLED', 'CRITICAL_REPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('UNIVERSITY', 'SCHOOL', 'MUNICIPALITY', 'COMMUNITY', 'NGO', 'CITY_COUNCIL', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PUBLIC',
    "institution" TEXT,
    "studentId" TEXT,
    "profileImage" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL DEFAULT 'UNIVERSITY',
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_points" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 240,
    "binType" TEXT NOT NULL DEFAULT 'General',
    "wasteCategory" "WasteCategoryEnum" NOT NULL DEFAULT 'MIXED',
    "collectionFrequency" TEXT NOT NULL DEFAULT 'Daily',
    "status" "CollectionPointStatus" NOT NULL DEFAULT 'ACTIVE',
    "qrPayload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_reports" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "collectionPointId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "wasteCategory" "WasteCategoryEnum" NOT NULL DEFAULT 'MIXED',
    "problemType" "ProblemType" NOT NULL DEFAULT 'BIN_OVERFLOWING',
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "internalNote" TEXT,
    "wasteAmountKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "waste_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_images" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "type" "ImageType" NOT NULL DEFAULT 'BEFORE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collector_assignments" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,

    CONSTRAINT "collector_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "reportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_status_history" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "oldStatus" "ReportStatus",
    "newStatus" "ReportStatus" NOT NULL,
    "changedById" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educational_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Recycling',
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educational_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "collection_points_code_key" ON "collection_points"("code");

-- CreateIndex
CREATE UNIQUE INDEX "collection_points_qrPayload_key" ON "collection_points"("qrPayload");

-- CreateIndex
CREATE INDEX "collection_points_organizationId_idx" ON "collection_points"("organizationId");

-- CreateIndex
CREATE INDEX "collection_points_status_idx" ON "collection_points"("status");

-- CreateIndex
CREATE INDEX "collection_points_code_idx" ON "collection_points"("code");

-- CreateIndex
CREATE UNIQUE INDEX "waste_reports_reportNumber_key" ON "waste_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "waste_reports_reporterId_idx" ON "waste_reports"("reporterId");

-- CreateIndex
CREATE INDEX "waste_reports_collectionPointId_idx" ON "waste_reports"("collectionPointId");

-- CreateIndex
CREATE INDEX "waste_reports_status_idx" ON "waste_reports"("status");

-- CreateIndex
CREATE INDEX "waste_reports_priority_idx" ON "waste_reports"("priority");

-- CreateIndex
CREATE INDEX "waste_reports_wasteCategory_idx" ON "waste_reports"("wasteCategory");

-- CreateIndex
CREATE INDEX "waste_reports_createdAt_idx" ON "waste_reports"("createdAt");

-- CreateIndex
CREATE INDEX "report_images_reportId_idx" ON "report_images"("reportId");

-- CreateIndex
CREATE INDEX "collector_assignments_reportId_idx" ON "collector_assignments"("reportId");

-- CreateIndex
CREATE INDEX "collector_assignments_collectorId_idx" ON "collector_assignments"("collectorId");

-- CreateIndex
CREATE INDEX "collector_assignments_status_idx" ON "collector_assignments"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "report_status_history_reportId_idx" ON "report_status_history"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "waste_categories_slug_key" ON "waste_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "waste_categories_name_key" ON "waste_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "educational_posts_slug_key" ON "educational_posts"("slug");

-- CreateIndex
CREATE INDEX "educational_posts_category_idx" ON "educational_posts"("category");

-- CreateIndex
CREATE INDEX "educational_posts_published_idx" ON "educational_posts"("published");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "collection_points" ADD CONSTRAINT "collection_points_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_reports" ADD CONSTRAINT "waste_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_reports" ADD CONSTRAINT "waste_reports_collectionPointId_fkey" FOREIGN KEY ("collectionPointId") REFERENCES "collection_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "waste_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_assignments" ADD CONSTRAINT "collector_assignments_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "waste_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_assignments" ADD CONSTRAINT "collector_assignments_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_assignments" ADD CONSTRAINT "collector_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "waste_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "waste_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educational_posts" ADD CONSTRAINT "educational_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

