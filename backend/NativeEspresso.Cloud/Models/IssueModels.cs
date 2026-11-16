using System.Text.Json.Serialization;

namespace NativeEspresso.Cloud.Models;

public record IssueReportRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("appId")] string AppId,
    [property: JsonPropertyName("platform")] string Platform,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("diagnosticData")] string? DiagnosticData = null,
    [property: JsonPropertyName("attachmentBase64")] string? AttachmentBase64 = null,
    [property: JsonPropertyName("attachmentFileName")] string? AttachmentFileName = null
);

public record IssueReportResponse(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("ticketNumber")] string TicketNumber,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("attachmentUrl")] string? AttachmentUrl = null
);
