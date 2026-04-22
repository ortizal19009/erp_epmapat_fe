using System.Drawing;
using System.Drawing.Printing;
using System.Runtime.InteropServices;
using PdfiumViewer;
using PrintBridge.Models;

namespace PrintBridge.Services;

public sealed class WindowsPrintBridgeService : IPrintBridgeService
{
  private static readonly Lazy<nint> PdfiumLibraryHandle = new(LoadPdfiumLibrary);

  public Task<IReadOnlyList<string>> ListPrintersAsync()
  {
    var printers = PrinterSettings.InstalledPrinters.Cast<string>().ToArray();
    return Task.FromResult<IReadOnlyList<string>>(printers);
  }

  public Task<string> GetDefaultPrinterAsync()
  {
    var settings = new PrinterSettings();
    return Task.FromResult(settings.PrinterName ?? string.Empty);
  }

  public Task PrintPdfAsync(PrintPdfRequest request)
  {
    ValidatePrinter(request.PrinterName);
    _ = PdfiumLibraryHandle.Value;

    var pdfBytes = Convert.FromBase64String(request.PdfBase64);
    using var stream = new MemoryStream(pdfBytes);
    using var document = PdfDocument.Load(stream);
    var settings = CreatePdfPrintSettings(request.PdfScaleFactor);
    using var printDocument = document.CreatePrintDocument(settings);

    ConfigurePrinter(printDocument, request.PrinterName, request.JobName, request.Copies);
    ApplyPaperFormat(printDocument, request.PdfPaperFormat);
    printDocument.Print();

    return Task.CompletedTask;
  }

  public Task PrintTextAsync(PrintTextRequest request)
  {
    ValidatePrinter(request.PrinterName);

    using var printDocument = new PrintDocument();
    ConfigurePrinter(printDocument, request.PrinterName, request.JobName, request.Copies);

    var lines = request.Lines?.ToArray() ?? Array.Empty<string>();
    var lineIndex = 0;
    var font = new Font("Consolas", 10);

    printDocument.PrintPage += (_, e) =>
    {
      var y = e.MarginBounds.Top;
      var graphics = e.Graphics ?? throw new InvalidOperationException("No se pudo obtener el contexto grafico de impresion.");
      var lineHeight = (int)Math.Ceiling(font.GetHeight(graphics) + 2);

      while (lineIndex < lines.Length)
      {
        var line = lines[lineIndex++] ?? string.Empty;
        graphics.DrawString(line, font, Brushes.Black, e.MarginBounds.Left, y);
        y += lineHeight;

        if (y + lineHeight > e.MarginBounds.Bottom)
        {
          e.HasMorePages = true;
          return;
        }
      }

      e.HasMorePages = false;
    };

    printDocument.Print();
    font.Dispose();

    return Task.CompletedTask;
  }

  private static void ConfigurePrinter(PrintDocument printDocument, string printerName, string jobName, int copies)
  {
    printDocument.DocumentName = string.IsNullOrWhiteSpace(jobName) ? "PrintBridge" : jobName.Trim();
    printDocument.PrinterSettings = new PrinterSettings
    {
      PrinterName = printerName,
      Copies = (short)Math.Clamp(copies, 1, 20),
      Collate = true,
      PrintRange = PrintRange.AllPages,
    };
    printDocument.DefaultPageSettings.Margins = new Margins(0, 0, 0, 0);
    printDocument.PrintController = new StandardPrintController();
  }

  private static void ValidatePrinter(string printerName)
  {
    if (string.IsNullOrWhiteSpace(printerName))
    {
      throw new InvalidOperationException("No se recibio una impresora valida.");
    }
  }

  private static PdfPrintSettings CreatePdfPrintSettings(double scaleFactor)
  {
    var normalizedScale = double.IsFinite(scaleFactor) && scaleFactor > 0
      ? Math.Clamp(scaleFactor, 0.5, 3.0)
      : 1.0;

    return new PdfPrintSettings(PdfPrintMode.Scale, normalizedScale);
  }

  private static void ApplyPaperFormat(PrintDocument printDocument, string paperFormat)
  {
    var format = string.IsNullOrWhiteSpace(paperFormat)
      ? "ticket80"
      : paperFormat.Trim().ToLowerInvariant();

    var paperSize = format switch
    {
      "a4" => new PaperSize("A4", MmToHundredthsInch(210), MmToHundredthsInch(297)),
      "ticket58" => new PaperSize("Receipt58mm", MmToHundredthsInch(58), 32767),
      _ => new PaperSize("Receipt80mm", MmToHundredthsInch(80), 32767),
    };

    printDocument.DefaultPageSettings.PaperSize = paperSize;
    printDocument.OriginAtMargins = false;
  }

  private static int MmToHundredthsInch(int millimeters)
  {
    return (int)Math.Round(millimeters / 25.4d * 100d);
  }

  private static nint LoadPdfiumLibrary()
  {
    var baseDirectory = AppContext.BaseDirectory;
    var candidates = new[]
    {
      Path.Combine(baseDirectory, "pdfium.dll"),
      Path.Combine(baseDirectory, "x64", "pdfium.dll"),
      Path.Combine(baseDirectory, "runtimes", "win-x64", "native", "pdfium.dll"),
    };

    foreach (var candidate in candidates)
    {
      if (File.Exists(candidate))
      {
        return NativeLibrary.Load(candidate);
      }
    }

    throw new DllNotFoundException(
      $"No se encontro pdfium.dll en '{baseDirectory}'. Ejecuta dotnet publish nuevamente para copiar la libreria nativa.");
  }
}
