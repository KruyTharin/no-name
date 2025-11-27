import { Injectable, Logger } from '@nestjs/common';
import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios';

export interface HttpClientConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    retries?: number;
    retryDelay?: number;
}

export interface RequestOptions extends AxiosRequestConfig {
    skipAuth?: boolean;
    customTimeout?: number;
}

/**
 * Enterprise-grade HTTP Client Service
 * Features:
 * - Request/Response interceptors
 * - Automatic retry logic
 * - Error handling and logging
 * - TypeScript support
 * - Authentication header injection
 */
@Injectable()
export class HttpClientService {
    private readonly logger = new Logger(HttpClientService.name);
    private axiosInstance: AxiosInstance;
    private config: HttpClientConfig;

    constructor(config?: HttpClientConfig) {
        this.config = {
            timeout: 10000, // 10 seconds default
            retries: 3,
            retryDelay: 1000,
            ...config,
        };

        this.axiosInstance = axios.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors(): void {
        // Request Interceptor
        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const startTime = Date.now();
                config.metadata = { startTime };

                this.logger.debug(
                    `→ ${config.method?.toUpperCase()} ${config.url}`,
                );

                // Add authentication token if available
                const token = this.getAuthToken();
                if (token && !config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                }

                return config;
            },
            (error: AxiosError) => {
                this.logger.error('Request interceptor error:', error.message);
                return Promise.reject(error);
            },
        );

        // Response Interceptor
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                const duration = Date.now() - (response.config.metadata?.startTime || 0);
                this.logger.debug(
                    `← ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`,
                );
                return response;
            },
            async (error: AxiosError) => {
                return this.handleResponseError(error);
            },
        );
    }

    /**
     * Handle response errors with retry logic
     */
    private async handleResponseError(error: AxiosError): Promise<any> {
        const config = error.config as any;
        const retries = config?.retries ?? this.config.retries;

        // Log error
        if (error.response) {
            this.logger.error(
                `HTTP Error: ${error.response.status} - ${error.config?.url}`,
                error.response.data,
            );
        } else if (error.request) {
            this.logger.error(`No response received: ${error.config?.url}`);
        } else {
            this.logger.error(`Request setup error: ${error.message}`);
        }

        // Retry logic for network errors or 5xx errors
        if (
            config &&
            retries > 0 &&
            this.shouldRetry(error)
        ) {
            config.retries = retries - 1;

            const delay = this.config.retryDelay || 1000;
            this.logger.warn(
                `Retrying request (${retries} attempts left) after ${delay}ms...`,
            );

            await this.sleep(delay);
            return this.axiosInstance.request(config);
        }

        return Promise.reject(this.formatError(error));
    }

    /**
     * Determine if request should be retried
     */
    private shouldRetry(error: AxiosError): boolean {
        // Retry on network errors
        if (!error.response) {
            return true;
        }

        // Retry on 5xx server errors
        const status = error.response.status;
        return status >= 500 && status < 600;
    }

    /**
     * Format error for consistent error handling
     */
    private formatError(error: AxiosError): any {
        return {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method,
        };
    }

    /**
     * Get authentication token (override this in your app)
     */
    private getAuthToken(): string | null {
        // TODO: Implement token retrieval from your auth service
        // Example: return this.authService.getToken();
        return null;
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * GET request
     */
    async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
        const response = await this.axiosInstance.get<T>(url, options);
        return response.data;
    }

    /**
     * POST request
     */
    async post<T = any>(
        url: string,
        data?: any,
        options?: RequestOptions,
    ): Promise<T> {
        const response = await this.axiosInstance.post<T>(url, data, options);
        return response.data;
    }

    /**
     * PUT request
     */
    async put<T = any>(
        url: string,
        data?: any,
        options?: RequestOptions,
    ): Promise<T> {
        const response = await this.axiosInstance.put<T>(url, data, options);
        return response.data;
    }

    /**
     * PATCH request
     */
    async patch<T = any>(
        url: string,
        data?: any,
        options?: RequestOptions,
    ): Promise<T> {
        const response = await this.axiosInstance.patch<T>(url, data, options);
        return response.data;
    }

    /**
     * DELETE request
     */
    async delete<T = any>(url: string, options?: RequestOptions): Promise<T> {
        const response = await this.axiosInstance.delete<T>(url, options);
        return response.data;
    }

    /**
     * Get raw axios instance for advanced usage
     */
    getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    /**
     * Update base URL dynamically
     */
    setBaseURL(baseURL: string): void {
        this.axiosInstance.defaults.baseURL = baseURL;
    }

    /**
     * Set default headers
     */
    setHeaders(headers: Record<string, string>): void {
        Object.assign(this.axiosInstance.defaults.headers.common, headers);
    }

    /**
     * Remove a header
     */
    removeHeader(key: string): void {
        delete this.axiosInstance.defaults.headers.common[key];
    }
}

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        metadata?: {
            startTime: number;
        };
        retries?: number;
    }
}
