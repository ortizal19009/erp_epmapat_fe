using System.Net.Mime;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting.WindowsServices;
using PrintBridge.Models;
using PrintBridge.Services;

var builder = WebApplication.CreateBuilder(args);

if (WindowsServiceHelpers.IsWindowsService())
{
  builder.Host.UseWindowsService();
}

var defaultUrl = WindowsServiceHelpers.IsWindowsService()
  ? "http://localhost:8787"
  : "http://localhost:8788";

builder.WebHost.UseUrls(builder.Configuration["Bridge:Url"] ?? defaultUrl);

builder.Services.AddCors(options =>
{
  options.AddPolicy("Frontend", policy =>
  {
    policy
      .WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
      .AllowAnyHeader()
      .AllowAnyMethod();
  });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
  options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddSingleton<IPrintBridgeService, WindowsPrintBridgeService>();
builder.Services.AddSingleton<AuthTokenGate>();

var app = builder.Build();

app.UseCors("Frontend");

app.Use(async (context, next) =>
{
  var origin = context.Request.Headers.Origin.ToString();
  if (origin is "http://localhost:4200" or "http://127.0.0.1:4200")
  {
    context.Response.Headers["Access-Control-Allow-Origin"] = origin;
    context.Response.Headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    context.Response.Headers["Vary"] = "Origin";
  }

  if (HttpMethods.IsOptions(context.Request.Method))
  {
    context.Response.StatusCode = StatusCodes.Status204NoContent;
    return;
  }

  await next();
});

app.Use(async (context, next) =>
{
  var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("PrintBridge");

  try
  {
    await next();
  }
  catch (Exception ex)
  {
    logger.LogError(ex, "Error procesando {Method} {Path}", context.Request.Method, context.Request.Path);

    if (!context.Response.HasStarted)
    {
      var origin = context.Request.Headers.Origin.ToString();
      if (origin is "http://localhost:4200" or "http://127.0.0.1:4200")
      {
        context.Response.Headers["Access-Control-Allow-Origin"] = origin;
        context.Response.Headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
        context.Response.Headers["Vary"] = "Origin";
      }

      context.Response.StatusCode = StatusCodes.Status500InternalServerError;
      context.Response.ContentType = "application/json";
      await context.Response.WriteAsJsonAsync(new ProblemDetails
      {
        Title = "Error en el puente local de impresion",
        Detail = ex.Message,
        Status = StatusCodes.Status500InternalServerError,
      });
    }
  }
});

app.Use(async (context, next) =>
{
  var gate = context.RequestServices.GetRequiredService<AuthTokenGate>();
  if (!gate.IsAuthorized(context))
  {
    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
    context.Response.ContentType = MediaTypeNames.Text.Plain;
    await context.Response.WriteAsync("Unauthorized");
    return;
  }

  await next();
});

app.MapGet("/health", () => Results.Ok(new HealthResponse(true)));

app.MapGet("/printers", async (IPrintBridgeService bridge) =>
{
  var printers = await bridge.ListPrintersAsync();
  return Results.Ok(new PrinterListResponse(printers));
});

app.MapGet("/printers/default", async (IPrintBridgeService bridge) =>
{
  var printer = await bridge.GetDefaultPrinterAsync();
  return Results.Ok(new DefaultPrinterResponse(printer));
});

app.MapPost("/print/pdf", async (PrintPdfRequest request, IPrintBridgeService bridge) =>
{
  await bridge.PrintPdfAsync(request);
  return Results.Ok(new BridgeResult(true, "PDF enviado a impresion."));
});

app.MapPost("/print/text", async (PrintTextRequest request, IPrintBridgeService bridge) =>
{
  await bridge.PrintTextAsync(request);
  return Results.Ok(new BridgeResult(true, "Texto enviado a impresion."));
});

app.Run();
