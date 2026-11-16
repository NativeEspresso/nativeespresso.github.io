using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NativeEspresso.Cloud.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWebApplication()
    .ConfigureServices(services =>
    {
        services.AddHttpClient();
        services.AddSingleton<IEmailDispatcher, EmailDispatcher>();
        services.AddSingleton<IDatabaseService, DatabaseService>();
        services.AddSingleton<IBlobStorageService, BlobStorageService>();
    })
    .Build();

host.Run();
