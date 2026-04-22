namespace PrintBridge.Models;

public sealed record HealthResponse(bool Ok);

public sealed record BridgeResult(bool Ok, string Message);

public sealed record PrinterListResponse(IReadOnlyList<string> Printers);

public sealed record DefaultPrinterResponse(string Printer);

public sealed record PrintPdfRequest(
    string JobName,
    string PrinterName,
    int Copies,
    bool Silent,
    double PdfScaleFactor,
    string PdfPaperFormat,
    string PdfBase64);

public sealed record PrintTextRequest(
    string JobName,
    string PrinterName,
    int Copies,
    bool Silent,
    IReadOnlyList<string> Lines);
