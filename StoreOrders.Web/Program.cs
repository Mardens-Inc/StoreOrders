using System.IO.Compression;
using Serilog;
using Serilog.Events;
using StoreOrders.Core.Constants;
using StoreOrders.Web.Components;

namespace StoreOrders.Web;

public class Program
{
    public static void Main(string[] args)
    {

        ApplicationConfiguration.Instance.Initialize(Files.ApplicationConfiguration);
        ConfigureLogging();

        AppDomain.CurrentDomain.ProcessExit += (_, _) =>
        {
            ApplicationConfiguration.Instance.Save();

            Log.Debug("Application exiting after {TIME}.", ApplicationData.UpTime);
            Log.CloseAndFlush();
        };

        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
        {
            if (e.ExceptionObject is Exception exception)
            {
                Log.Fatal(exception, "Unhandled exception: {REPORT}", CrashHandler.Report(exception));
            }
        };

        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddRazorComponents()
            .AddInteractiveServerComponents();
        builder.Services.AddControllers();
        builder.Services.AddSerilog();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Error");
            // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            app.UseHsts();
        }

        app.UseHttpsRedirection();
        app.MapControllers();
        app.UseSerilogRequestLogging();

        app.UseStaticFiles();
        app.UseAntiforgery();

        app.MapRazorComponents<App>()
            .AddInteractiveServerRenderMode();

        app.Run($"http://127.0.0.1:{builder.Configuration.GetValue<int>("Server:Port")}");
    }


    private static void ConfigureLogging()
    {
        // Initialize Logging
        string[] logs = Directory.GetFiles(Directories.Logs, "*.log");
        if (logs.Length != 0)
        {
            using ZipArchive archive =
                ZipFile.Open(Path.Combine(Directories.Logs, $"logs-{DateTime.Now:MM-dd-yyyy HH-mm-ss.ffff}.zip"),
                    ZipArchiveMode.Create);
            foreach (string log in logs)
            {
                archive.CreateEntryFromFile(log, Path.GetFileName(log));
                File.Delete(log);
            }
        }

        TimeSpan flushTime = TimeSpan.FromSeconds(30);
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console(
#if DEBUG
                LogEventLevel.Verbose,
#else
                ApplicationConfiguration.Instance.LogLevel,
#endif
                outputTemplate:
                $"[{ApplicationData.ApplicationName}] [{{Timestamp:HH:mm:ss}} {{Level:u3}}] {{Message:lj}}{{NewLine}}{{Exception}}")
            .MinimumLevel.Verbose()
            .WriteTo.File(Files.DebugLog, buffered: true, flushToDiskInterval: flushTime)
            .WriteTo.File(Files.LatestLog, LogEventLevel.Information, buffered: true, flushToDiskInterval: flushTime)
            .WriteTo.File(Files.ErrorLog, LogEventLevel.Error, buffered: false)
            .CreateLogger();
    }
}