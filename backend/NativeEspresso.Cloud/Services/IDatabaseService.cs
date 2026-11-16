using NativeEspresso.Cloud.Models;

namespace NativeEspresso.Cloud.Services;

public interface IDatabaseService
{
    Task<string> UpsertTesterAsync(RegistrationRequest req);
    Task<TesterStatusResponse?> GetTesterStatusAsync(string email, string appId);
    Task<bool> ApproveTesterAsync(string email, string appId, string playStoreUrl);
    Task<string> SaveIssueReportAsync(IssueReportRequest req, string? attachmentUrl);
}
