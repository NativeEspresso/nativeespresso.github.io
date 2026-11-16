namespace NativeEspresso.Cloud.Services;

public interface IEmailDispatcher
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent);
}
