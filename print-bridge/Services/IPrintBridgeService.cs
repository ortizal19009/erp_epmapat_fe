using PrintBridge.Models;

namespace PrintBridge.Services;

public interface IPrintBridgeService
{
  Task<IReadOnlyList<string>> ListPrintersAsync();
  Task<string> GetDefaultPrinterAsync();
  Task PrintPdfAsync(PrintPdfRequest request);
  Task PrintTextAsync(PrintTextRequest request);
}
