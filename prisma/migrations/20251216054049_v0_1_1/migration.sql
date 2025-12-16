-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `stats` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Tenant_name_key`(`name`),
    INDEX `Tenant_active_deletedAt_idx`(`active`, `deletedAt`),
    INDEX `Tenant_name_active_idx`(`name`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantSettings` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `sessionDuration` INTEGER NOT NULL DEFAULT 86400,
    `maxLoginAttempts` INTEGER NOT NULL DEFAULT 5,
    `lockoutDuration` INTEGER NOT NULL DEFAULT 1800,
    `require2FA` BOOLEAN NOT NULL DEFAULT false,
    `passwordMinLength` INTEGER NOT NULL DEFAULT 8,
    `passwordRequireSpecial` BOOLEAN NOT NULL DEFAULT true,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    `currency` VARCHAR(3) NOT NULL DEFAULT 'BRL',
    `language` VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    `features` JSON NOT NULL,
    `maxAdmins` INTEGER NULL DEFAULT 100,
    `maxCustomers` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `TenantSettings_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `Role_tenantId_deletedAt_idx`(`tenantId`, `deletedAt`),
    INDEX `Role_tenantId_name_deletedAt_idx`(`tenantId`, `name`, `deletedAt`),
    UNIQUE INDEX `Role_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `resource` ENUM('PRODUCT', 'ORDER', 'FINANCE', 'CUSTOMER', 'SUPPORT', 'ADMINS', 'OWNER') NOT NULL,
    `action` ENUM('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE') NOT NULL,
    `attributes` JSON NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `RolePermission_roleId_idx`(`roleId`),
    INDEX `RolePermission_resource_action_idx`(`resource`, `action`),
    INDEX `RolePermission_roleId_resource_idx`(`roleId`, `resource`),
    UNIQUE INDEX `RolePermission_roleId_resource_action_key`(`roleId`, `resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `type` ENUM('SERVER', 'BUSINESS') NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `twoFactorSecret` VARCHAR(255) NULL,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `recoveryCodes` JSON NULL,
    `passwordChangedAt` DATETIME(3) NULL,
    `passwordExpiresAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Admin_email_key`(`email`),
    INDEX `Admin_tenantId_deletedAt_idx`(`tenantId`, `deletedAt`),
    INDEX `Admin_tenantId_roleId_deletedAt_idx`(`tenantId`, `roleId`, `deletedAt`),
    INDEX `Admin_type_isActive_deletedAt_idx`(`type`, `isActive`, `deletedAt`),
    INDEX `Admin_email_isActive_idx`(`email`, `isActive`),
    INDEX `Admin_tenantId_isActive_type_idx`(`tenantId`, `isActive`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `Customer_phone_key`(`phone`),
    INDEX `Customer_tenantId_phone_deletedAt_idx`(`tenantId`, `phone`, `deletedAt`),
    INDEX `Customer_tenantId_isActive_deletedAt_idx`(`tenantId`, `isActive`, `deletedAt`),
    INDEX `Customer_phone_isActive_idx`(`phone`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerLogin` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `type` ENUM('PHONE_ONLY', 'EMAIL_PASSWORD', 'EMAIL_PASSWORD_2FA') NOT NULL,
    `email` VARCHAR(255) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `lastLogin` DATETIME(3) NULL,
    `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `twoFactorSecret` VARCHAR(255) NULL,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `recoveryCodes` JSON NULL,
    `passwordChangedAt` DATETIME(3) NULL,
    `passwordExpiresAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,

    INDEX `CustomerLogin_customerId_deletedAt_idx`(`customerId`, `deletedAt`),
    INDEX `CustomerLogin_email_deletedAt_idx`(`email`, `deletedAt`),
    INDEX `CustomerLogin_type_isVerified_deletedAt_idx`(`type`, `isVerified`, `deletedAt`),
    INDEX `CustomerLogin_email_isVerified_idx`(`email`, `isVerified`),
    UNIQUE INDEX `CustomerLogin_customerId_type_deletedAt_key`(`customerId`, `type`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `ownerType` ENUM('ADMIN', 'CUSTOMER') NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `ip` VARCHAR(45) NULL,
    `agent` TEXT NULL,
    `city` VARCHAR(255) NULL,
    `deviceId` VARCHAR(255) NULL,
    `deviceName` VARCHAR(255) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_token_key`(`token`),
    INDEX `Session_token_active_idx`(`token`, `active`),
    INDEX `Session_adminId_active_expiresAt_idx`(`adminId`, `active`, `expiresAt`),
    INDEX `Session_customerId_active_expiresAt_idx`(`customerId`, `active`, `expiresAt`),
    INDEX `Session_active_expiresAt_idx`(`active`, `expiresAt`),
    INDEX `Session_ownerType_active_idx`(`ownerType`, `active`),
    INDEX `Session_tenantId_active_expiresAt_idx`(`tenantId`, `active`, `expiresAt`),
    INDEX `Session_tenantId_ownerType_active_idx`(`tenantId`, `ownerType`, `active`),
    INDEX `Session_deviceId_active_idx`(`deviceId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(255) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PERMISSION_CHANGE') NOT NULL,
    `description` TEXT NULL,
    `performedBy` VARCHAR(255) NOT NULL,
    `performedByType` ENUM('ADMIN', 'CUSTOMER') NOT NULL,
    `changes` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `sessionId` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_tenantId_entityType_entityId_createdAt_idx`(`tenantId`, `entityType`, `entityId`, `createdAt`),
    INDEX `AuditLog_performedBy_createdAt_idx`(`performedBy`, `createdAt`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_tenantId_action_createdAt_idx`(`tenantId`, `action`, `createdAt`),
    INDEX `AuditLog_entityType_entityId_createdAt_idx`(`entityType`, `entityId`, `createdAt`),
    INDEX `AuditLog_tenantId_performedBy_createdAt_idx`(`tenantId`, `performedBy`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(255) NOT NULL,
    `type` ENUM('ADMIN', 'CUSTOMER') NOT NULL,
    `success` BOOLEAN NOT NULL,
    `reason` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NOT NULL,
    `userAgent` TEXT NULL,
    `deviceId` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoginAttempt_identifier_createdAt_idx`(`identifier`, `createdAt`),
    INDEX `LoginAttempt_tenantId_success_createdAt_idx`(`tenantId`, `success`, `createdAt`),
    INDEX `LoginAttempt_tenantId_identifier_success_createdAt_idx`(`tenantId`, `identifier`, `success`, `createdAt`),
    INDEX `LoginAttempt_ip_createdAt_idx`(`ip`, `createdAt`),
    INDEX `LoginAttempt_success_createdAt_idx`(`success`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `type` ENUM('PASSWORD_RESET', 'EMAIL_VERIFY', 'PHONE_VERIFY', 'TWO_FACTOR') NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `adminId` VARCHAR(191) NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `usedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedFromIp` VARCHAR(45) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    INDEX `VerificationToken_token_used_expiresAt_idx`(`token`, `used`, `expiresAt`),
    INDEX `VerificationToken_customerId_type_used_expiresAt_idx`(`customerId`, `type`, `used`, `expiresAt`),
    INDEX `VerificationToken_adminId_type_used_expiresAt_idx`(`adminId`, `type`, `used`, `expiresAt`),
    INDEX `VerificationToken_type_used_expiresAt_idx`(`type`, `used`, `expiresAt`),
    INDEX `VerificationToken_tenantId_type_used_createdAt_idx`(`tenantId`, `type`, `used`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TenantSettings` ADD CONSTRAINT `TenantSettings_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Customer` ADD CONSTRAINT `Customer_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomerLogin` ADD CONSTRAINT `CustomerLogin_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginAttempt` ADD CONSTRAINT `LoginAttempt_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationToken` ADD CONSTRAINT `VerificationToken_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationToken` ADD CONSTRAINT `VerificationToken_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationToken` ADD CONSTRAINT `VerificationToken_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
