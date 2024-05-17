namespace StoreOrders.Core.Constants;

using static Directories;

public class Files
{
    public static string ApplicationConfiguration { get; } = Path.Combine(Root, "application.json");
    public static string LatestLog { get; } = Path.Combine(Logs, "latest.log");
    public static string ErrorLog { get; } = Path.Combine(Logs, "error.log");
    public static string DebugLog { get; } = Path.Combine(Logs, "debug.log");
}