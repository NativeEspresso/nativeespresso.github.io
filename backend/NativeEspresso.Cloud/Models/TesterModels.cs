using System.Text.Json.Serialization;

namespace NativeEspresso.Cloud.Models;

public record RegistrationRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("appId")] string AppId,
    [property: JsonPropertyName("appName")] string AppName,
    [property: JsonPropertyName("platform")] string Platform = "Android"
);

public record RegistrationResponse(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("playStoreUrl")] string? PlayStoreUrl = null
);

public record TesterStatusResponse(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("appId")] string AppId,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("playStoreUrl")] string? PlayStoreUrl,
    [property: JsonPropertyName("registeredAt")] DateTime RegisteredAt,
    [property: JsonPropertyName("approvedAt")] DateTime? ApprovedAt
);

public record ApproveTesterRequest(
    [property: JsonPropertyName("adminKey")] string AdminKey,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("appId")] string AppId,
    [property: JsonPropertyName("playStoreUrl")] string PlayStoreUrl
);
