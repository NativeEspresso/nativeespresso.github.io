namespace NativeEspresso.Cloud.Services;

public interface IBlobStorageService
{
    Task<string?> UploadAttachmentAsync(string base64Data, string fileName);
}
