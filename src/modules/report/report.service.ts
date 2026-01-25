import ExcelJS from 'exceljs';
import { Animal } from '../animal/animal.model';
import { MilkCollection } from '../milk-collection/milk-collection.model';
import { Expense } from '../expense/expense.model';
import { Insemination } from '../breeding/insemination.model';
import { MilkRate } from '../milk-rate/milk-rate.model';
import { User } from '../auth/user.model';

export type ReportType = 'weekly' | 'monthly' | 'total' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ReportData {
  animals: any[];
  milkCollections: any[];
  expenses: any[];
  breeding: any[];
  milkRates: any[];
  userName: string;
  summary: {
    totalAnimals: number;
    activeAnimals: number;
    totalMilkLiters: number;
    totalMilkRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
}

class ReportService {
  /**
   * Get date range based on report type
   */
  getDateRange(type: ReportType, customStart?: string, customEnd?: string): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.setHours(23, 59, 59, 999));

    switch (type) {
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'custom':
        if (!customStart || !customEnd) {
          throw new Error('Start date and end date are required for custom reports');
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        if (startDate > endDate) {
          throw new Error('Start date must be before end date');
        }
        break;

      case 'total':
      default:
        startDate = new Date(0); // Unix epoch
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Fetch all data for the report
   */
  async fetchReportData(userId: string, dateRange: DateRange): Promise<ReportData> {
    const { startDate, endDate } = dateRange;

    // Fetch user info
    const user = await User.findById(userId).lean();
    const userName = user?.name || 'User';

    // Fetch animals
    const animals = await Animal.find({ userId }).lean() as any[];

    // Fetch milk collections (grouped by animalType, no individual animal tracking)
    const milkCollections = await MilkCollection.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean() as any[];

    // Fetch expenses
    const expenses = await Expense.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean() as any[];

    // Fetch breeding records
    const breeding = await Insemination.find({
      userId,
      inseminationDate: { $gte: startDate, $lte: endDate },
    })
      .populate('animal', 'serialNumber nickName')
      .lean() as any[];

    // Fetch milk rates
    const milkRates = await MilkRate.find({
      userId,
      effectiveFrom: { $lte: endDate },
    })
      .sort({ effectiveFrom: -1 })
      .lean() as any[];

    // Calculate summary
    const totalMilkLiters = milkCollections.reduce((sum: number, mc: any) => sum + (mc.totalMilk || 0), 0);
    const totalMilkRevenue = milkCollections.reduce((sum: number, mc: any) => sum + (mc.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    const activeAnimals = animals.filter((a: any) => a.isActive && !a.isSold).length;

    return {
      animals,
      milkCollections,
      expenses,
      breeding,
      milkRates,
      userName,
      summary: {
        totalAnimals: animals.length,
        activeAnimals,
        totalMilkLiters: Math.round(totalMilkLiters * 100) / 100,
        totalMilkRevenue: Math.round(totalMilkRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round((totalMilkRevenue - totalExpenses) * 100) / 100,
      },
    };
  }

  /**
   * Generate Excel workbook
   */
  async generateExcel(userId: string, reportType: ReportType, customStart?: string, customEnd?: string): Promise<ExcelJS.Workbook> {
    const dateRange = this.getDateRange(reportType, customStart, customEnd);
    const data = await this.fetchReportData(userId, dateRange);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Dairy Farm Manager';
    workbook.created = new Date();

    // Add Summary Sheet
    this.addSummarySheet(workbook, data, dateRange);

    // Add Animals Sheet
    this.addAnimalsSheet(workbook, data.animals);

    // Add Milk Collection Sheet
    this.addMilkCollectionSheet(workbook, data.milkCollections);

    // Add Expenses Sheet
    this.addExpensesSheet(workbook, data.expenses);

    // Add Breeding Sheet
    this.addBreedingSheet(workbook, data.breeding);

    // Add Milk Rates Sheet
    this.addMilkRatesSheet(workbook, data.milkRates);

    return workbook;
  }

  /**
   * Add Summary Sheet
   */
  private addSummarySheet(workbook: ExcelJS.Workbook, data: ReportData, dateRange: DateRange) {
    const sheet = workbook.addWorksheet('Summary', {
      views: [{ showGridLines: true }],
    });

    // Title
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `🐄 ${data.userName} Dairy Farm Report`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4CAF50' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Date Range
    sheet.mergeCells('A2:D2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Period: ${this.formatDate(dateRange.startDate)} - ${this.formatDate(dateRange.endDate)}`;
    dateCell.font = { size: 12, bold: true };
    dateCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = ['Metric', 'Value', '', ''];
    sheet.addRow(headers);
    const headerRow = sheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2196F3' } };
    headerRow.height = 25;

    // Summary Data
    const summaryData = [
      ['Total Animals', data.summary.totalAnimals],
      ['Active Animals', data.summary.activeAnimals],
      ['Total Milk Collected (Liters)', data.summary.totalMilkLiters],
      ['Total Milk Revenue (₹)', data.summary.totalMilkRevenue],
      ['Total Expenses (₹)', data.summary.totalExpenses],
      ['Net Profit/Loss (₹)', data.summary.netProfit],
    ];

    summaryData.forEach((row, index) => {
      const dataRow = sheet.addRow(row);
      if (index === summaryData.length - 1) {
        dataRow.font = { bold: true };
        dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: data.summary.netProfit >= 0 ? 'C8E6C9' : 'FFCDD2' } };
      }
    });

    // Styling
    sheet.getColumn(1).width = 35;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(2).alignment = { horizontal: 'right' };
  }

  /**
   * Add Animals Sheet
   */
  private addAnimalsSheet(workbook: ExcelJS.Workbook, animals: any[]) {
    const sheet = workbook.addWorksheet('Animals');

    // Headers
    const headers = ['Tag Number', 'Name', 'Type', 'Gender', 'Date of Birth', 'Status', 'Purchase Price'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2196F3' } };

    // Data
    animals.forEach(animal => {
      const status = animal.isSold ? 'sold' : (animal.isActive ? 'active' : 'inactive');
      sheet.addRow([
        animal.serialNumber || '-',
        animal.nickName || '-',
        animal.animalType || '-',
        animal.gender || '-',
        animal.dateOfBirth ? this.formatDate(new Date(animal.dateOfBirth)) : '-',
        status,
        animal.purchasePrice || 0,
      ]);
    });

    // Column widths
    sheet.columns.forEach(column => { column.width = 15; });
    sheet.getColumn(2).width = 20; // Name
  }

  /**
   * Add Milk Collection Sheet
   */
  private addMilkCollectionSheet(workbook: ExcelJS.Workbook, collections: any[]) {
    const sheet = workbook.addWorksheet('Milk Collection');

    // Headers
    const headers = ['Date', 'Animal Type', 'Session', 'Quantity (L)', 'Rate (₹/L)', 'Amount (₹)'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2196F3' } };

    // Data
    collections.forEach(mc => {
      sheet.addRow([
        this.formatDate(new Date(mc.date)),
        mc.animalType || 'N/A',
        mc.session,
        mc.totalMilk,
        mc.rateApplied,
        mc.totalAmount,
      ]);
    });

    // Column widths
    sheet.columns.forEach(column => { column.width = 15; });
  }

  /**
   * Add Expenses Sheet
   */
  private addExpensesSheet(workbook: ExcelJS.Workbook, expenses: any[]) {
    const sheet = workbook.addWorksheet('Expenses');

    // Headers
    const headers = ['Date', 'Category', 'Description', 'Amount (₹)', 'Notes'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2196F3' } };

    // Data
    expenses.forEach(exp => {
      sheet.addRow([
        this.formatDate(new Date(exp.date)),
        exp.category,
        exp.description,
        exp.amount,
        exp.notes || '',
      ]);
    });

    // Column widths
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 30;
  }

  /**
   * Add Breeding Sheet
   */
  private addBreedingSheet(workbook: ExcelJS.Workbook, breeding: any[]) {
    const sheet = workbook.addWorksheet('Breeding Records');

    // Headers
    const headers = ['Date', 'Animal Tag', 'Animal Name', 'Doctor', 'Semen Type', 'Breed', 'Status', 'Check Date'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2196F3' } };

    // Data
    breeding.forEach(b => {
      sheet.addRow([
        this.formatDate(new Date(b.inseminationDate)),
        b.animal?.serialNumber || '-',
        b.animal?.nickName || '-',
        b.doctorName || '-',
        b.semenType || '-',
        b.breed || '-',
        b.pregnancyStatus || '-',
        b.pregnancyCheckDate ? this.formatDate(new Date(b.pregnancyCheckDate)) : '-',
      ]);
    });

    // Column widths
    sheet.columns.forEach(column => { column.width = 18; });
  }

  /**
   * Add Milk Rates Sheet
   */
  private addMilkRatesSheet(workbook: ExcelJS.Workbook, rates: any[]) {
    const sheet = workbook.addWorksheet('Milk Rates');

    // Headers
    const headers = ['Effective Date', 'Animal Type', 'Rate (₹/L)'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2196F3' } };

    // Data
    rates.forEach(rate => {
      sheet.addRow([
        this.formatDate(new Date(rate.effectiveFrom)),
        rate.animalType,
        rate.ratePerLiter,
      ]);
    });

    // Column widths
    sheet.columns.forEach(column => { column.width = 20; });
  }

  /**
   * Generate filename based on report type
   */
  generateFilename(reportType: ReportType, customStart?: string, customEnd?: string): string {
    const now = new Date();
    
    switch (reportType) {
      case 'weekly':
        return `dairy-report-weekly-${now.toISOString().split('T')[0]}.xlsx`;
      
      case 'monthly':
        const month = now.toLocaleString('default', { month: 'long' });
        return `dairy-report-monthly-${month}-${now.getFullYear()}.xlsx`;
      
      case 'custom':
        if (customStart && customEnd) {
          const start = new Date(customStart).toISOString().split('T')[0];
          const end = new Date(customEnd).toISOString().split('T')[0];
          return `dairy-report-custom-${start}-to-${end}.xlsx`;
        }
        return `dairy-report-custom-${now.toISOString().split('T')[0]}.xlsx`;
      
      case 'total':
      default:
        return `dairy-report-total-${now.toISOString().split('T')[0]}.xlsx`;
    }
  }

  /**
   * Format date to DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export const reportService = new ReportService();
