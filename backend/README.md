# Native Espresso Cloud Backend (Azure Functions .NET 8)

This directory contains the production-ready serverless backend for **Native Espresso**, providing:
1. **Google Play Closed Testing Queue**: Direct email intake, status verification, and automated approval workflows.
2. **Dual-Email Cascade Engine**: Zero-cost, high-reliability transactional email delivery via **Resend** (Primary: 100/day free) and **Brevo** (Fallback: 300/day free).
3. **Web-Based Support & Diagnostic Portal**: Direct issue submission for when in-app forms in Android or Windows encounter problems, with optional Azure Blob Storage attachments.

---

## 1. Quickstart Architecture

```text
backend/NativeEspresso.Cloud/
├── NativeEspresso.Cloud.csproj  <-- .NET 8.0 Isolated Worker Azure Functions
├── Program.cs                   <-- Dependency Injection & Services Setup
├── schema.sql                   <-- Azure SQL database creation script
├── host.json                    <-- Function host configuration
├── local.settings.json.example  <-- Environment variables template
├── Models/
│   ├── TesterModels.cs          <-- Registration, Status & Approval DTOs
│   └── IssueModels.cs           <-- Support Ticket & Issue Report DTOs
├── Services/
│   ├── IEmailDispatcher.cs      <-- Dual-provider email interface
│   ├── EmailDispatcher.cs       <-- Resend + Brevo cascade implementation
│   ├── IDatabaseService.cs      <-- Database contract
│   ├── DatabaseService.cs       <-- Azure SQL parameterized repository
│   ├── IBlobStorageService.cs   <-- Cloud storage contract
│   └── BlobStorageService.cs    <-- Azure Blob Storage attachment uploader
└── Functions/
    ├── TesterFunctions.cs       <-- /api/testers/register, /api/testers/status, /api/admin/approve-tester
    └── SupportFunctions.cs      <-- /api/support/report-issue
```

---

## 2. Setting Up Cloud Services (100% Free Tiers)

### A. Azure SQL Database (Free Tier)
1. In the [Azure Portal](https://portal.azure.com/), create an **Azure SQL Database**.
2. Select the **Free Tier** (100,000 vCore seconds/month, 32 GB storage free for the life of your subscription).
3. Open the **Query Editor** in Azure Portal, copy the contents of `schema.sql`, and run it. This creates the `Testers` and `IssueReports` tables with optimized indexes.
4. Copy the SQL Connection String into `AZURE_SQL_CONNECTION_STRING`.

### B. Azure Blob Storage (Free for 12 months, then ~$0.01/GB)
1. Create a **Storage Account** in Azure (General Purpose v2, LRS).
2. Copy the Connection String into `BLOB_STORAGE_CONNECTION_STRING`.
3. The function will automatically create the `support-attachments` container.

### C. Free Transactional Email Setup (Resend + Brevo)
1. **Resend (Primary)**:
   * Create an account at [resend.com](https://resend.com/).
   * Generate an API Key and place it in `RESEND_API_KEY`.
   * Free tier provides 100 emails/day (3,000/month).
2. **Brevo / Sendinblue (Secondary Fallback)**:
   * Create an account at [brevo.com](https://www.brevo.com/).
   * Generate an API Key and place it in `BREVO_API_KEY`.
   * Free tier provides 300 emails/day (9,000/month).
3. Combined capacity: **400 free emails per day (up to 12,000/month)**.

---

## 3. Local Development

1. Copy `local.settings.json.example` to `local.settings.json`:
   ```bash
   cp local.settings.json.example local.settings.json
   ```
2. Run the Azure Functions host locally:
   ```bash
   cd NativeEspresso.Cloud
   func start
   ```
3. Test locally using curl or Postman:
   ```bash
   curl -X POST http://localhost:7071/api/testers/register \
     -H "Content-Type: application/json" \
     -d '{"email":"tester@example.com","appId":"trans-title","appName":"Trans-Title","platform":"Android"}'
   ```

---

## 4. Deploying to Microsoft Azure

1. Create a **Function App** in Azure Portal:
   * Runtime stack: `.NET`
   * Version: `8 (Isolated)`
   * Operating System: `Linux` or `Windows`
   * Plan: `Consumption (Serverless)` (First 1,000,000 executions/month are free)
2. Deploy via Azure Functions Core Tools:
   ```bash
   func azure functionapp publish <YOUR_FUNCTION_APP_NAME>
   ```
3. In Azure Portal, navigate to **Function App → CORS**:
   * Add: `https://nativeespresso.github.io`
4. On your GitHub Pages site, you can set the global API endpoint in `<head>`:
   ```html
   <script>window.NE_API_BASE = "https://<YOUR_FUNCTION_APP_NAME>.azurewebsites.net";</script>
   ```
