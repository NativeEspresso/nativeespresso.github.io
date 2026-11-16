using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace NativeEspresso.Cloud.Services;

public class EmailDispatcher : IEmailDispatcher
{
    private readonly HttpClient _http;
    private readonly ILogger<EmailDispatcher> _logger;
    private readonly string _resendKey;
    private readonly string _brevoKey;
    private readonly string _senderEmail;
    private readonly string _senderName;

    public EmailDispatcher(HttpClient http, ILogger<EmailDispatcher> logger)
    {
        _http = http;
        _logger = logger;
        _resendKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") ?? string.Empty;
        _brevoKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? string.Empty;
        _senderEmail = Environment.GetEnvironmentVariable("SENDER_EMAIL") ?? "native.espresso@gmail.com";
        _senderName = Environment.GetEnvironmentVariable("SENDER_NAME") ?? "Native Espresso Studio";
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        // 1. PRIMARY: Try Resend API (100 free emails/day, 3,000/month)
        if (!string.IsNullOrWhiteSpace(_resendKey) && !_resendKey.Contains("YourResend"))
        {
            try
            {
                using var resendReq = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
                resendReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _resendKey);

                var payload = new
                {
                    from = $"{_senderName} <{_senderEmail}>",
                    to = new[] { toEmail },
                    subject = subject,
                    html = htmlContent
                };
                resendReq.Content = JsonContent.Create(payload);

                var response = await _http.SendAsync(resendReq);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email} via Resend.", toEmail);
                    return true;
                }

                var resBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Resend dispatch returned {StatusCode}: {Response}. Cascading to Brevo fallback...", response.StatusCode, resBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Resend dispatch threw an exception. Cascading to Brevo fallback...");
            }
        }

        // 2. SECONDARY / FALLBACK: Try Brevo API (300 free emails/day, 9,000/month)
        if (!string.IsNullOrWhiteSpace(_brevoKey) && !_brevoKey.Contains("YourBrevo"))
        {
            try
            {
                using var brevoReq = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
                brevoReq.Headers.Add("api-key", _brevoKey);

                var brevoPayload = new
                {
                    sender = new { name = _senderName, email = _senderEmail },
                    to = new[] { new { email = toEmail } },
                    subject = subject,
                    htmlContent = htmlContent
                };
                brevoReq.Content = JsonContent.Create(brevoPayload);

                var response = await _http.SendAsync(brevoReq);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email} via Brevo.", toEmail);
                    return true;
                }

                var resBody = await response.Content.ReadAsStringAsync();
                _logger.LogError("Brevo dispatch returned {StatusCode}: {Response}", response.StatusCode, resBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Brevo dispatch threw an exception.");
            }
        }

        _logger.LogWarning("All email dispatch providers bypassed or failed for {Email}.", toEmail);
        return false;
    }
}
