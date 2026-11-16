using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;

namespace NativeEspresso.Cloud.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly string _connectionString;
    private readonly ILogger<BlobStorageService> _logger;
    private const string ContainerName = "support-attachments";

    public BlobStorageService(ILogger<BlobStorageService> logger)
    {
        _logger = logger;
        _connectionString = Environment.GetEnvironmentVariable("BLOB_STORAGE_CONNECTION_STRING") ?? string.Empty;
    }

    public async Task<string?> UploadAttachmentAsync(string base64Data, string fileName)
    {
        if (string.IsNullOrWhiteSpace(_connectionString) || _connectionString.Contains("YourBlobKeyHere"))
        {
            _logger.LogInformation("Blob storage not configured. Skipping attachment upload.");
            return null;
        }

        try
        {
            var serviceClient = new BlobServiceClient(_connectionString);
            var containerClient = serviceClient.GetBlobContainerClient(ContainerName);
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            string safeFileName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
            var blobClient = containerClient.GetBlobClient(safeFileName);

            byte[] bytes = Convert.FromBase64String(base64Data);
            using var stream = new MemoryStream(bytes);
            await blobClient.UploadAsync(stream, overwrite: true);

            return blobClient.Uri.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload attachment to Azure Blob Storage.");
            return null;
        }
    }
}
