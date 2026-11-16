using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using NativeEspresso.Cloud.Models;

namespace NativeEspresso.Cloud.Services;

public class DatabaseService : IDatabaseService
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(ILogger<DatabaseService> logger)
    {
        _logger = logger;
        _connectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTION_STRING") ?? string.Empty;
    }

    private async Task<SqlConnection> GetConnectionAsync()
    {
        var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();
        return conn;
    }

    public async Task<string> UpsertTesterAsync(RegistrationRequest req)
    {
        if (string.IsNullOrWhiteSpace(_connectionString) || _connectionString.Contains("YourSecurePassword"))
        {
            _logger.LogWarning("Azure SQL connection string is not configured. Simulating Pending status.");
            return "Pending";
        }

        try
        {
            await using var conn = await GetConnectionAsync();
            const string sql = @"
                MERGE dbo.Testers AS target
                USING (SELECT @Email AS Email, @AppId AS AppId) AS source
                ON (target.Email = source.Email AND target.AppId = source.AppId)
                WHEN MATCHED THEN
                    UPDATE SET Platform = @Platform, AppName = @AppName
                WHEN NOT MATCHED THEN
                    INSERT (Email, AppId, AppName, Platform, Status, RegisteredAt)
                    VALUES (@Email, @AppId, @AppName, @Platform, 'Pending', SYSUTCDATETIME());

                SELECT Status FROM dbo.Testers WHERE Email = @Email AND AppId = @AppId;
            ";

            await using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Email", req.Email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@AppId", req.AppId.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@AppName", req.AppName);
            cmd.Parameters.AddWithValue("@Platform", req.Platform);

            var status = await cmd.ExecuteScalarAsync();
            return status?.ToString() ?? "Pending";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upsert tester {Email} in Azure SQL.", req.Email);
            return "Pending";
        }
    }

    public async Task<TesterStatusResponse?> GetTesterStatusAsync(string email, string appId)
    {
        if (string.IsNullOrWhiteSpace(_connectionString) || _connectionString.Contains("YourSecurePassword"))
        {
            return new TesterStatusResponse(email, appId, "Pending", null, DateTime.UtcNow, null);
        }

        try
        {
            await using var conn = await GetConnectionAsync();
            const string sql = @"
                SELECT Email, AppId, Status, PlayStoreOptInUrl, RegisteredAt, ApprovedAt
                FROM dbo.Testers
                WHERE Email = @Email AND AppId = @AppId;
            ";

            await using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Email", email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@AppId", appId.Trim().ToLowerInvariant());

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new TesterStatusResponse(
                    reader.GetString("Email"),
                    reader.GetString("AppId"),
                    reader.GetString("Status"),
                    reader.IsDBNull("PlayStoreOptInUrl") ? null : reader.GetString("PlayStoreOptInUrl"),
                    reader.GetDateTime("RegisteredAt"),
                    reader.IsDBNull("ApprovedAt") ? null : reader.GetDateTime("ApprovedAt")
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tester status for {Email}.", email);
        }

        return null;
    }

    public async Task<bool> ApproveTesterAsync(string email, string appId, string playStoreUrl)
    {
        if (string.IsNullOrWhiteSpace(_connectionString) || _connectionString.Contains("YourSecurePassword"))
        {
            return true;
        }

        try
        {
            await using var conn = await GetConnectionAsync();
            const string sql = @"
                UPDATE dbo.Testers
                SET Status = 'Approved',
                    PlayStoreOptInUrl = @PlayStoreUrl,
                    ApprovedAt = SYSUTCDATETIME()
                WHERE Email = @Email AND AppId = @AppId;
            ";

            await using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Email", email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@AppId", appId.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@PlayStoreUrl", playStoreUrl);

            int rows = await cmd.ExecuteNonQueryAsync();
            return rows > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to approve tester {Email}.", email);
            return false;
        }
    }

    public async Task<string> SaveIssueReportAsync(IssueReportRequest req, string? attachmentUrl)
    {
        string ticketNumber = "NE-" + Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(_connectionString) || _connectionString.Contains("YourSecurePassword"))
        {
            _logger.LogInformation("Simulated issue report ticket generated: {Ticket}", ticketNumber);
            return ticketNumber;
        }

        try
        {
            await using var conn = await GetConnectionAsync();
            const string sql = @"
                INSERT INTO dbo.IssueReports (TicketNumber, Email, AppId, Platform, Category, Description, DiagnosticData, AttachmentUrl, Status, CreatedAt)
                VALUES (@TicketNumber, @Email, @AppId, @Platform, @Category, @Description, @DiagnosticData, @AttachmentUrl, 'Open', SYSUTCDATETIME());
            ";

            await using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@TicketNumber", ticketNumber);
            cmd.Parameters.AddWithValue("@Email", req.Email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@AppId", req.AppId.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@Platform", req.Platform);
            cmd.Parameters.AddWithValue("@Category", req.Category);
            cmd.Parameters.AddWithValue("@Description", req.Description);
            cmd.Parameters.AddWithValue("@DiagnosticData", (object?)req.DiagnosticData ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@AttachmentUrl", (object?)attachmentUrl ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
            return ticketNumber;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save issue report in Azure SQL.");
            return ticketNumber;
        }
    }
}
