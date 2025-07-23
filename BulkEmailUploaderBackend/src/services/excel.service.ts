import * as xlsx from 'xlsx';
import { IUser } from '../interfaces/user.interface';

export class ExcelService {
  static async parseExcel(buffer: Buffer): Promise<IUser[]> {
    const workbook = xlsx.read(buffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const data = xlsx.utils.sheet_to_json(worksheet) as IUser[];
    
    // Validate data structure
    return data.map(row => {
      if (!row.email || !row.name || !row.password) {
        throw new Error('Excel file must contain name, email, and password columns');
      }
      return {
        name: row.name,
        email: row.email,
        password: row.password
      };
    });
  }
}