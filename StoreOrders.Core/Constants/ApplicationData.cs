using System.Diagnostics;
using System.Reflection;

namespace StoreOrders.Core.Constants;

public static class ApplicationData
{
    public static string ApplicationName { get; } = "Store Orders";
    public static TimeSpan UpTime => DateTime.Now - Process.GetCurrentProcess().StartTime;
    public static Assembly MainAssembly { get; } = Assembly.GetExecutingAssembly();
    public static AssemblyName? AssemblyName { get; } = MainAssembly.GetName();
    public static Version? Version { get; } = AssemblyName.Version;

    public static object GenerateApplicationData()
    {
        return new
        {
            ApplicationName,
            Version,
            UpTime,
            Process.GetCurrentProcess().StartTime,
            Environment = "RELEASE",
            Config = ApplicationConfiguration.Instance,
        };
    }
}