namespace StoreOrders.Core.Constants;

public static class Directories
{
    public static string Root { get; } = Directory.CreateDirectory(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data")).FullName;
    public static string Logs { get; } = Directory.CreateDirectory(Path.Combine(Root, "logs")).FullName;
    public static string ApplicationData { get; } = Directory.CreateDirectory(Path.Combine(Root, "appdata")).FullName;
}