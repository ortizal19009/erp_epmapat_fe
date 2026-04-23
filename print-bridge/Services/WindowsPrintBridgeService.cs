using System.Drawing;
using System.Drawing.Printing;
using System.Runtime.InteropServices;
using PdfiumViewer;
using PrintBridge.Models;

namespace PrintBridge.Services;

public sealed class WindowsPrintBridgeService : IPrintBridgeService
{
  private static readonly Lazy<nint> PdfiumLibraryHandle = new(LoadPdfiumLibrary);
  private const int MaxTicketHeightMm = 297;

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

    var paperFormat = NormalizePaperFormat(request.PdfPaperFormat);
    var copies = Math.Clamp(request.Copies, 2, 20);
    for (var i = 0; i < copies; i++)
    {
      var pdfBytes = Convert.FromBase64String(request.PdfBase64);
      using var stream = new MemoryStream(pdfBytes);
      using var document = PdfDocument.Load(stream);
      var settings = CreatePdfPrintSettings(paperFormat, request.PdfScaleFactor);
      using var printDocument = document.CreatePrintDocument(settings);

      ConfigurePrinter(printDocument, request.PrinterName, request.JobName, 1);
      ApplyPaperFormat(printDocument, document, paperFormat);
      printDocument.Print();
    }

    return Task.CompletedTask;
  }

  public Task PrintTextAsync(PrintTextRequest request)
  {
    ValidatePrinter(request.PrinterName);

    using var printDocument = new PrintDocument();
    ConfigurePrinter(printDocument, request.PrinterName, request.JobName, 1);
    ApplyPaperFormat(printDocument, "ticket80");

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

    var copies = Math.Clamp(request.Copies, 2, 20);
    for (var i = 0; i < copies; i++)
    {
      printDocument.Print();
    }
    font.Dispose();

    return Task.CompletedTask;
  }

  private static void ConfigurePrinter(PrintDocument printDocument, string printerName, string jobName, int copies)
  {
    printDocument.DocumentName = string.IsNullOrWhiteSpace(jobName) ? "PrintBridge" : jobName.Trim();
    printDocument.PrinterSettings = new PrinterSettings
    {
      PrinterName = printerName,
      Copies = 1,
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

  private static PdfPrintSettings CreatePdfPrintSettings(string paperFormat, double scaleFactor)
  {
    var format = NormalizePaperFormat(paperFormat);
    var normalizedScale = double.IsFinite(scaleFactor) && scaleFactor > 0
      ? Math.Clamp(scaleFactor, 0.5, 3.0)
      : 1.0;

    return format == "a4"
      ? new PdfPrintSettings(PdfPrintMode.Scale, normalizedScale)
      : new PdfPrintSettings(PdfPrintMode.CutMargin);
  }

  private static void ApplyPaperFormat(PrintDocument printDocument, PdfDocument document, string paperFormat)
  {
    var format = NormalizePaperFormat(paperFormat);

    var pdfPageSize = TryGetFirstPageSize(document);
    var paperSize = format switch
    {
      "a4" => new PaperSize("A4", MmToHundredthsInch(210), MmToHundredthsInch(297)),
      "ticket58" => pdfPageSize.HasValue
        ? ToPaperSize("Receipt58mm", pdfPageSize.Value)
        : new PaperSize("Receipt58mm", MmToHundredthsInch(58), MmToHundredthsInch(MaxTicketHeightMm)),
      _ => pdfPageSize.HasValue
        ? ToPaperSize("Receipt80mm", pdfPageSize.Value)
        : new PaperSize("Receipt80mm", MmToHundredthsInch(80), MmToHundredthsInch(MaxTicketHeightMm)),
    };

    printDocument.DefaultPageSettings.PaperSize = paperSize;
    printDocument.DefaultPageSettings.Landscape = format == "a4"
      ? true
      : (pdfPageSize?.Width ?? paperSize.Width) > (pdfPageSize?.Height ?? paperSize.Height);
    printDocument.OriginAtMargins = false;
  }

  private static void ApplyPaperFormat(PrintDocument printDocument, string paperFormat)
  {
    var format = NormalizePaperFormat(paperFormat);
    var paperSize = format switch
    {
      "a4" => new PaperSize("A4", MmToHundredthsInch(210), MmToHundredthsInch(297)),
      "ticket58" => new PaperSize("Receipt58mm", MmToHundredthsInch(58), MmToHundredthsInch(MaxTicketHeightMm)),
      _ => new PaperSize("Receipt80mm", MmToHundredthsInch(80), MmToHundredthsInch(MaxTicketHeightMm)),
    };

    printDocument.DefaultPageSettings.PaperSize = paperSize;
    printDocument.DefaultPageSettings.Landscape = format == "a4";
    printDocument.OriginAtMargins = false;
  }

  private static PaperSize ToPaperSize(string name, SizeF pageSizeInPoints)
  {
    var width = PointsToHundredthsInch(pageSizeInPoints.Width);
    var height = PointsToHundredthsInch(pageSizeInPoints.Height);
    return new PaperSize(name, width, height);
  }

  private static SizeF? TryGetFirstPageSize(PdfDocument document)
  {
    if (document.PageSizes == null || document.PageSizes.Count == 0)
    {
      return null;
    }

    return document.PageSizes[0];
  }

  private static int PointsToHundredthsInch(float points)
  {
    return (int)Math.Round(points / 72f * 100f);
  }

  private static string NormalizePaperFormat(string paperFormat)
  {
    return string.IsNullOrWhiteSpace(paperFormat)
      ? "ticket80"
      : paperFormat.Trim().ToLowerInvariant();
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
