using System.Text.Json.Serialization;
using Chase.CommonLib.FileSystem.Configuration;
using Newtonsoft.Json;
using Serilog.Events;

namespace StoreOrders.Core.Constants;

public record DatabaseConfiguration
{
    [JsonProperty("host")]
    [JsonPropertyName("host")]
    public string Host { get; set; } = "localhost";

    [JsonProperty("port")]
    [JsonPropertyName("port")]
    public int Port { get; set; } = 3306;

    [JsonProperty("username")]
    [JsonPropertyName("username")]
    public string Username { get; set; } = "root";

    [JsonProperty("password")]
    [JsonPropertyName("password")]
    public string Password { get; set; } = "";

    [JsonProperty("database")]
    [JsonPropertyName("database")]
    public string Database { get; set; } = "warehouse";

    [JsonProperty("ssl-mode")]
    [JsonPropertyName("ssl-mode")]
    public string SslMode { get; set; } = "Preferred";
}

public class ApplicationConfiguration : AppConfigBase<ApplicationConfiguration>
{
    [JsonPropertyName("encryption-key")]
    [JsonProperty("encryption-key")]
    public string EncryptionSalt { get; set; } = Guid.NewGuid().ToString("N");

    [JsonPropertyName("log-level")]
    [JsonProperty("log-level")]
    public LogEventLevel LogLevel { get; set; } = LogEventLevel.Information;

    [JsonPropertyName("database")]
    [JsonProperty("database")]
    public DatabaseConfiguration Database { get; set; } = new();

}