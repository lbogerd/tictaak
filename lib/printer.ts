"use server";

import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";

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
    printer.println(title);
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
