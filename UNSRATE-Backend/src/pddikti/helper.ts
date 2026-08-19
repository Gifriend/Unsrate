import axios, { AxiosResponse } from 'axios';

export class Helper {
  private url: string =
    'aHR0cHM6Ly9hcGktcGRkaWt0aS5rZW1kaWt0aXNhaW50ZWsuZ28uaWQ='; //base 64 encoded URL
  private host: string = 'YXBpLXBkZGlrdGkua2VtZGlrdGlzYWludGVrLmdvLmlk'; //base 64 encoded URL
  private origin: string =
    'aHR0cHM6Ly9wZGRpa3RpLmtlbWRpa3Rpc2FpbnRlay5nby5pZA=='; //base 64 encoded URL
  private referer: string =
    'aHR0cHM6Ly9wZGRpa3RpLmtlbWRpa3Rpc2FpbnRlay5nby5pZC8='; //base 64 encoded URL
  private ip: string = 'MTAzLjQ3LjEzMi4yOQ==';

  /**
   * Retrieves the public IP address of the machine.
   */
  async getIp(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (e) {
      console.error(`Error fetching IP: ${e}`);
      return this.decodes(this.ip);
    }
  }

  /**
   * Returns headers for API requests.
   */
  async getHeaders(): Promise<Record<string, string>> {
    return {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9,mt;q=0.8',
      Connection: 'keep-alive',
      DNT: '1',
      Host: this.decodes(this.host),
      Origin: this.decodes(this.origin),
      Referer: this.decodes(this.referer),
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
      'X-User-IP': await this.getIp(),
      'sec-ch-ua':
        '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    };
  }

  /**
   * Sends a GET request and returns the JSON response.
   */
  async response<T>(endpoint: string): Promise<T | null> {
    const headers = await this.getHeaders();
    try {
      const response: AxiosResponse<T> = await axios.get(endpoint, { headers });
      return response.data;
    } catch (e) {
      console.error(`Error fetching data: ${e}`);
      return null;
    }
  }

  /**
   * Encodes a string into a valid URL format.
   */
  parse(string: string): string {
    return encodeURIComponent(string);
  }

  /**
   * Decodes a base64 encoded string.
   */
  decodes(string: string): string {
    return Buffer.from(string, 'base64').toString('utf-8');
  }

  /**
   * Returns the decoded API endpoint URL.
   */
  endpoint(): string {
    return this.decodes(this.url);
  }

  /**
   * Appends a version to the decoded URL.
   */
  withVersion(version: string): string {
    return this.endpoint() + version;
  }
}
