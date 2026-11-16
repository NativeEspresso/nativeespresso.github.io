-- ==============================================================================
-- Native Espresso — Azure SQL Database Schema
-- Tables: Testers (Closed Testing Queue) & IssueReports (Diagnostic & Support)
-- Compatible with Azure SQL Database (Free Tier / Serverless)
-- ==============================================================================

-- 1. Create Testers Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Testers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Testers] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        [Email] NVARCHAR(256) NOT NULL,
        [AppId] NVARCHAR(64) NOT NULL,               -- 'trans-title' or 'echo-cleaner'
        [AppName] NVARCHAR(128) NOT NULL,            -- 'Trans-Title' or 'Echo Cleaner'
        [Platform] NVARCHAR(32) NOT NULL DEFAULT 'Android',
        [Status] NVARCHAR(32) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
        [PlayStoreOptInUrl] NVARCHAR(512) NULL,      -- e.g. https://play.google.com/apps/testing/...
        [RegisteredAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ApprovedAt] DATETIME2 NULL,
        [LastNotifiedAt] DATETIME2 NULL,
        [Notes] NVARCHAR(MAX) NULL,

        CONSTRAINT [UQ_Testers_Email_App] UNIQUE NONCLUSTERED ([Email], [AppId])
    );

    CREATE NONCLUSTERED INDEX [IX_Testers_Status_App] ON [dbo].[Testers] ([Status], [AppId]);
END
GO

-- 2. Create IssueReports Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IssueReports]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[IssueReports] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        [TicketNumber] NVARCHAR(36) NOT NULL DEFAULT NEWID(),
        [Email] NVARCHAR(256) NOT NULL,
        [AppId] NVARCHAR(64) NOT NULL,
        [Platform] NVARCHAR(32) NOT NULL,            -- 'Windows', 'Android', 'iOS'
        [Category] NVARCHAR(64) NOT NULL,            -- 'windows-store', 'android-install', 'audio-permission', 'general'
        [Description] NVARCHAR(MAX) NOT NULL,
        [DiagnosticData] NVARCHAR(MAX) NULL,         -- JSON or string: OS build, hardware details
        [AttachmentUrl] NVARCHAR(512) NULL,          -- Azure Blob Storage URL for screenshot/log
        [Status] NVARCHAR(32) NOT NULL DEFAULT 'Open', -- 'Open', 'InReview', 'Resolved', 'Closed'
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ResolvedAt] DATETIME2 NULL,
        [AdminNotes] NVARCHAR(MAX) NULL
    );

    CREATE NONCLUSTERED INDEX [IX_IssueReports_Status] ON [dbo].[IssueReports] ([Status], [CreatedAt]);
    CREATE NONCLUSTERED INDEX [IX_IssueReports_Email] ON [dbo].[IssueReports] ([Email]);
END
GO
