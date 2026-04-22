namespace PrintBridge.Services;

public sealed class AuthTokenGate(IConfiguration configuration)
{
  private readonly string _token = configuration["Bridge:Token"]?.Trim() ?? string.Empty;

  public bool IsAuthorized(HttpContext context)
  {
    if (string.IsNullOrWhiteSpace(_token))
    {
      return true;
    }

    if (!context.Request.Headers.TryGetValue("Authorization", out var header))
    {
      return false;
    }

    var value = header.ToString();
    return value.Equals($"Bearer {_token}", StringComparison.Ordinal);
  }
}
