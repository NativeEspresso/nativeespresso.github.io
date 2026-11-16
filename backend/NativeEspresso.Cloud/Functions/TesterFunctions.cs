using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using NativeEspresso.Cloud.Models;
using NativeEspresso.Cloud.Services;

namespace NativeEspresso.Cloud.Functions;

public class TesterFunctions
{
    private readonly IDatabaseService _db;
    private readonly IEmailDispatcher _email;
    private readonly ILogger<TesterFunctions> _logger;

    public TesterFunctions(IDatabaseService db, IEmailDispatcher email, ILogger<TesterFunctions> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    [Function("RegisterTester")]
    public async Task<HttpResponseData> Register(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "testers/register")] HttpRequestData req)
    {
        _logger.LogInformation("Received registration request.");
        string body = await req.ReadAsStringAsync() ?? string.Empty;
        var model = JsonSerializer.Deserialize<RegistrationRequest>(body);

        if (string.IsNullOrWhiteSpace(model?.Email) || !model.Email.Contains('@'))
        {
            var badRes = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRes.WriteAsJsonAsync(new RegistrationResponse(false, "Invalid", "Please provide a valid email address."));
            return badRes;
        }

        // 1. Save to Database
        string currentStatus = await _db.UpsertTesterAsync(model);

        // 2. Dispatch Welcome Email via Dual-Provider Cascade (Resend -> Brevo)
        string welcomeHtml = $@"
            <div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #0f172a; line-height: 1.6;"">
                <div style=""background: #070a13; padding: 24px; border-radius: 14px 14px 0 0; text-align: center;"">
                    <h2 style=""color: #22d3ee; margin: 0; font-size: 20px; font-weight: 700;"">NATIVE ESPRESSO</h2>
                    <p style=""color: #94a3b8; margin: 4px 0 0; font-size: 13px;"">On-Device AI &amp; High-Performance Audio Studio</p>
                </div>
                <div style=""background: #ffffff; padding: 32px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;"">
                    <h3 style=""color: #0f172a; margin-top: 0;"">Closed Testing Waitlist Confirmed!</h3>
                    <p>Hi there,</p>
                    <p>Thank you for volunteering to test <strong>{model.AppName}</strong>! We have received your request and placed your Google Play email (<code>{model.Email}</code>) into our priority testing queue.</p>
                    <div style=""background: #f1f5f9; padding: 18px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #22d3ee;"">
                        <strong style=""display: block; margin-bottom: 6px;"">What happens next?</strong>
                        <ol style=""margin: 0; padding-left: 20px; color: #475569; font-size: 14px;"">
                            <li>We add your email to the authorized Google Play Closed Testing track.</li>
                            <li>You will receive an automated invitation link directly to download via Google Play.</li>
                            <li>You can also revisit our website at any time to check your status or scan your phone QR code.</li>
                        </ol>
                    </div>
                    <p style=""font-size: 13px; color: #64748b;"">If you have any questions or device specifics, reply directly to this email.</p>
                    <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"" />
                    <p style=""font-size: 12px; color: #94a3b8; text-align: center; margin: 0;"">Native Espresso · 100% On-Device Processing · Zero Data Surveillance</p>
                </div>
            </div>
        ";

        _ = _email.SendEmailAsync(model.Email, $"[Queue Reserved] {model.AppName} Closed Testing Ticket", welcomeHtml);

        var res = req.CreateResponse(HttpStatusCode.OK);
        await res.WriteAsJsonAsync(new RegistrationResponse(true, currentStatus, "Registration logged successfully."));
        return res;
    }

    [Function("CheckTesterStatus")]
    public async Task<HttpResponseData> CheckStatus(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "testers/status")] HttpRequestData req)
    {
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        string email = query["email"] ?? string.Empty;
        string appId = query["appId"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(appId))
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("Missing email or appId query parameters.");
            return bad;
        }

        var tester = await _db.GetTesterStatusAsync(email, appId);
        if (tester == null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteStringAsync("Tester record not found.");
            return notFound;
        }

        var res = req.CreateResponse(HttpStatusCode.OK);
        await res.WriteAsJsonAsync(tester);
        return res;
    }

    [Function("ApproveTester")]
    public async Task<HttpResponseData> Approve(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "admin/approve-tester")] HttpRequestData req)
    {
        string expectedKey = Environment.GetEnvironmentVariable("ADMIN_API_KEY") ?? "ChangeThisToASecretKeyForApprovingTesters";
        string body = await req.ReadAsStringAsync() ?? string.Empty;
        var model = JsonSerializer.Deserialize<ApproveTesterRequest>(body);

        if (model == null || model.AdminKey != expectedKey)
        {
            var unauth = req.CreateResponse(HttpStatusCode.Unauthorized);
            await unauth.WriteStringAsync("Invalid admin key.");
            return unauth;
        }

        bool updated = await _db.ApproveTesterAsync(model.Email, model.AppId, model.PlayStoreUrl);
        if (!updated)
        {
            var err = req.CreateResponse(HttpStatusCode.BadRequest);
            await err.WriteStringAsync("Failed to update tester record.");
            return err;
        }

        // Send Approval Email with Play Store Opt-In Link
        string approvalHtml = $@"
            <div style=""font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #0f172a; line-height: 1.6;"">
                <div style=""background: #070a13; padding: 24px; border-radius: 14px 14px 0 0; text-align: center;"">
                    <h2 style=""color: #10b981; margin: 0; font-size: 20px; font-weight: 700;"">VIP TESTER ACCESS UNLOCKED</h2>
                    <p style=""color: #94a3b8; margin: 4px 0 0; font-size: 13px;"">Native Espresso Closed Testing Track</p>
                </div>
                <div style=""background: #ffffff; padding: 32px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;"">
                    <h3 style=""color: #0f172a; margin-top: 0;"">You Are Approved to Test!</h3>
                    <p>Your Google Play email (<code>{model.Email}</code>) is now authorized on the official Google Play Closed Testing track.</p>
                    <div style=""text-align: center; margin: 28px 0;"">
                        <a href=""{model.PlayStoreUrl}"" style=""background: #10b981; color: #ffffff; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; display: inline-block;"">
                            Accept Invitation on Google Play &rarr;
                        </a>
                    </div>
                    <p style=""font-size: 13px; color: #64748b;"">Note: If Google Play displays an error, ensure you are logged into Google Play with <strong>{model.Email}</strong> and wait 5 minutes for Google's server propagation.</p>
                </div>
            </div>
        ";

        _ = _email.SendEmailAsync(model.Email, $"[Approved] Your Google Play Testing Access is Ready!", approvalHtml);

        var res = req.CreateResponse(HttpStatusCode.OK);
        await res.WriteAsJsonAsync(new { success = true, email = model.Email, status = "Approved" });
        return res;
    }
}
