import { Injectable } from '@nestjs/common';
import { Helper } from './helper';

export interface MahasiswaData {
  nim: string;
  [key: string]: any;
}

@Injectable()
export class PddiktiApi {
  private H: Helper;
  private apiLink: string;

  constructor() {
    this.H = new Helper();
    this.apiLink = this.H.endpoint();
  }

  /**
   * Error handling wrapper for API calls
   */
  private async handleErrors<T>(
    callback: () => Promise<T | null>,
  ): Promise<T | null> {
    try {
      const response = await callback();
      if (
        !response ||
        (typeof response === 'object' &&
          response !== null &&
          'error' in response)
      ) {
        throw new Error('API response indicates an error');
      }
      return response;
    } catch (e) {
      console.error(`API error: ${e}`);
      return null;
    }
  }

  /**
   * Search for student data by NIM
   */
  async searchMahasiswa(keyword: string): Promise<MahasiswaData | null> {
    return this.handleErrors<MahasiswaData>(async () => {
      const endpoint = `${this.apiLink}/pencarian/mhs/${this.H.parse(keyword)}`;
      const response = await this.H.response<MahasiswaData[]>(endpoint);

      if (response && Array.isArray(response)) {
        return response.find((x) => x.nim === keyword) || null;
      }
      return null;
    });
  }
}
