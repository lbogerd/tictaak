'use server'

import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer'

export async function printTask(title: string, category: string, createdAt: Date) {
  try {
    const printerUrl = process.env.PRINTER_URL || 'tcp://192.168.50.195:9100'
    
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: printerUrl,
      characterSet: CharacterSet.PC437_USA,
      removeSpecialCharacters: true,
      lineCharacter: "=",
      width: 32, // TM-T20III has 32 character width
    })

    // Check if printer is connected
    let isConnected = await printer.isPrinterConnected()
    if (!isConnected) {
      throw new Error('Printer not connected')
    }

    // Format the task ticket for TM-T20III
    printer.alignCenter()
    printer.println("TICTAAK TASK")
    printer.drawLine()
    printer.alignLeft()
    printer.newLine()
    
    printer.bold(true)
    printer.println("TASK:")
    printer.bold(false)
    printer.println(title)
    printer.newLine()
    
    printer.bold(true)
    printer.println("CATEGORY:")
    printer.bold(false)
    printer.println(category)
    printer.newLine()
    
    printer.bold(true)
    printer.println("CREATED:")
    printer.bold(false)
    printer.println(createdAt.toLocaleString())
    printer.newLine()
    
    printer.drawLine()
    printer.alignCenter()
    printer.println("Happy completing!")
    printer.newLine()
    
    // Cut the paper
    printer.cut()

    await printer.execute()
    return { success: true }
  } catch (error) {
    console.error('Printing failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}