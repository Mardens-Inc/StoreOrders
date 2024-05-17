using Newtonsoft.Json;
using Serilog;

namespace StoreOrders.Core.Constants;

public static class CrashHandler
{
    public static void ReportAndExit(Exception ex)
    {
        string file = Report(ex);

        Log.Error("A crash report has been generated at {file}", file);
        Environment.Exit(1);
    }

    public static string Report(Exception ex)
    {
        DateTime now = DateTime.Now;
        string formattedTime = now.ToString("dddd MMMM dd, yyyy - hh-mm-ss.fff tt");
        string file = Path.Combine(Directories.Root, $"crash ({formattedTime}).txt");

        using FileStream fs = new(file, FileMode.Create);
        using StreamWriter writer = new(fs);
        writer.WriteLine($"{ApplicationData.ApplicationName} Crash Report - {formattedTime}");
        writer.WriteLine("\nApplication Data:");
        writer.WriteLine($"\tOS: {Environment.OSVersion.VersionString}");
        writer.WriteLine($"\tVersion: {ApplicationData.Version}");
        writer.WriteLine("\nCrash Data:");
        writer.WriteLine($"\tMessage: {ex.Message}");
        writer.WriteLine($"\tSource: {ex.Source}");
        writer.WriteLine($"\tData: {JsonConvert.SerializeObject(ex.Data)}");

        writer.WriteLine($"Stack Trace:\n{ex.StackTrace}");

        return file;
    }
    
}