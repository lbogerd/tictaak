"use server";

import {
  CharacterSet,
  PrinterTypes,
  ThermalPrinter,
} from "node-thermal-printer";

/**
 * Prints a task to the printer.
 * @param title - The title of the task.
 * @param category - The category of the task.
 * @returns The result of the print operation.
 */
export async function printTask(title: string, category: string) {
  try {
    const printerUrl = process.env.PRINTER_URL || "tcp://192.168.50.195:9100";

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: printerUrl,
      characterSet: CharacterSet.PC437_USA,
      removeSpecialCharacters: true,
      lineCharacter: "=",
      width: 48, // TM-T20III has 48 character width
    });

    // Check if printer is connected
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Printer not connected");
    }

    // Format the task ticket for TM-T20III
    printer.alignCenter();
    printer.println("TICTAAK");
    printer.drawLine();
    printer.alignLeft();
    printer.newLine();

    printer.setTextQuadArea();
    printer.println(await wrapForThermalPrinter(title));
    printer.setTextNormal();

    printer.newLine();
    printer.println(`category: ${category}`);
    printer.newLine();
    printer.newLine();

    printer.println(new Date().toLocaleString("nl")); // Format date for Dutch locale
    printer.newLine();
    printer.drawLine();

    // Cut the paper
    printer.cut();

    await printer.execute();
    return { success: true };
  } catch (error) {
    console.error("Printing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/** Options for the wrapper */
export interface WrapOptions {
  /** Maximum printable columns per line (thermal-printer width). */
  maxWidth?: number; // default = 48
  /**
   * After how many characters a *single* word should be chopped
   * and continued on the next line with a trailing “-”.
   * Must be ≤ maxWidth − 1.  (default = maxWidth − 1)
   */
  chunkAfter?: number;
}

/**
 * Split plain-text into \n-separated lines for a fixed-width printer,
 * without breaking words—unless a word is longer than `chunkAfter`,
 * in which case it’s chunked and hyphenated.
 */
export async function wrapForThermalPrinter(
  text: string,
  { maxWidth = 48, chunkAfter = maxWidth - 1 }: WrapOptions = {}
): Promise<string> {
  // Sanity-guard: the chunk length can’t exceed the printable width.
  chunkAfter = Math.min(chunkAfter, maxWidth - 1);

  const out: string[] = [];

  // Helper: split an oversize word into hyphenated pieces
  const chunkWord = async (word: string): Promise<string[]> => {
    const parts: string[] = [];
    for (let i = 0; i < word.length; i += chunkAfter) {
      const slice = word.slice(i, i + chunkAfter);
      const isLast = i + chunkAfter >= word.length;
      parts.push(isLast ? slice : slice + "-");
    }
    return parts;
  };

  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";

    for (const raw of paragraph.split(/\s+/)) {
      if (!raw) continue; // ignore double-spaces, etc.

      // Expand an over-long “word” into hyphenated pieces if needed
      const pieces = raw.length > chunkAfter ? await chunkWord(raw) : [raw];

      for (const word of pieces) {
        if (!line.length) {
          line = word;
        } else if (line.length + 1 + word.length <= maxWidth) {
          line += " " + word;
        } else {
          out.push(line);
          line = word;
        }
      }
    }

    if (line) out.push(line);
  }

  return out.join("\n");
}
