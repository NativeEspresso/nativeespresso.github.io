using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using NativeEspresso.Cloud.Models;
using NativeEspresso.Cloud.Services;

namespace NativeEspresso.Cloud.Functions;

public class SupportFunctions
{
    private readonly IDatabaseService _db;
    private readonly IBlobStorageService _storage;
    private readonly IEmailDispatcher _email;
    private readonly ILogger<SupportFunctions> _logger;
    private readonly string _adminNotifyEmail;

    public SupportFunctions(IDatabaseService db, IBlobStorageService storage, IEmailDispatcher email, ILogger<SupportFunctions> logger)
    {
        _db = db;
        _storage = storage;
        _email = email;
        _logger = logger;
        _adminNotifyEmail = Environment.GetEnvironmentVariable("SENDER_EMAIL") ?? "native.espresso@gmail.com";
    }

    [Function("ReportIssue")]
    public async Task<HttpResponseData> ReportIssue(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "support/report-issue")] HttpRequestData req)
    {
        _logger.LogInformation("Received issue report.");
        string body = await req.ReadAsStringAsync() ?? string.Empty;
        var model = JsonSerializer.Deserialize<IssueReportRequest>(body);

        if (string.IsNullOrWhiteSpace(model?.Email) || string.IsNullOrWhiteSpace(model.Description))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteAsJsonAsync(new IssueReportResponse(false, string.Empty, "Missing email or issue description."));
            return bad;
        }

        // 1. Upload attachment to Blob Storage if provided
        string? attachmentUrl = null;
        if (!string.IsNullOrWhiteSpace(model.AttachmentBase64) && !string.IsNullOrWhiteSpace(model.AttachmentFileName))
        {
            attachmentUrl = await _storage.UploadAttachmentAsync(model.AttachmentBase64, model.AttachmentFileName);
        }

        // 2. Save ticket in Azure SQL Database
        string ticketNumber = await _db.SaveIssueReportAsync(model, attachmentUrl);

        // 3. Send automated confirmation to user
        string userConfirmHtml = $@"
            <div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #0f172a; line-height: 1.6;"">
                <div style=""background: #070a13; padding: 24px; border-radius: 14px 14px 0 0; text-align: center;"">
                    <h2 style=""color: #22d3ee; margin: 0; font-size: 20px; font-weight: 700;"">NATIVE ESPRESSO SUPPORT</h2>
                </div>
                <div style=""background: #ffffff; padding: 32px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;"">
                    <h3 style=""color: #0f172a; margin-top: 0;"">Ticket #{ticketNumber} Received</h3>
                    <p>We received your issue report regarding <strong>{model.AppId}</strong> ({model.Platform}).</p>
                    <div style=""background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; margin: 16px 0;"">
                        <strong>Category:</strong> {model.Category}<br>
                        <strong>Description:</strong> {model.Description}
                    </div>
                    <p style=""font-size: 14px; color: #475569;"">Our development team in Sargodha will inspect this report and reply to you directly within 24 hours.</p>
                </div>
            </div>
        ";
        _ = _email.SendEmailAsync(model.Email, $"[Ticket #{ticketNumber}] Support Request Received", userConfirmHtml);

        // 4. Alert Developer Inbox
        string devAlertHtml = $@"
            <p><strong>New Support Ticket Submitted</strong></p>
            <p><strong>Ticket:</strong> {ticketNumber}</p>
            <p><strong>From:</strong> {model.Email}</p>
            <p><strong>App:</strong> {model.AppId} ({model.Platform})</p>
            <p><strong>Category:</strong> {model.Category}</p>
            <p><strong>Description:</strong><br>{model.Description}</p>
            {(attachmentUrl != null ? $"<p><strong>Attachment:</strong> <a href='{attachmentUrl}'>{attachmentUrl}</a></p>" : "")}
        ";
        _ = _email.SendEmailAsync(_adminNotifyEmail, $"[ALERT] New Support Ticket #{ticketNumber} ({model.AppId})", devAlertHtml);

        var res = req.CreateResponse(HttpStatusCode.OK);
        await res.WriteAsJsonAsync(new IssueReportResponse(true, ticketNumber, "Ticket submitted successfully.", attachmentUrl));
        return res;
    }
}
