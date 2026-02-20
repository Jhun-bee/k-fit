import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';

interface UseApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    execute: (config?: AxiosRequestConfig) => Promise<T | null>;
}

export function useApi<T>(url: string, initialData: T | null = null): UseApiResponse<T> {
    const [data, setData] = useState<T | null>(initialData);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const execute = useCallback(async (config?: AxiosRequestConfig) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios(url, config);
            setData(response.data);
            return response.data;
        } catch (err) {
            const axiosError = err as AxiosError<{ detail?: string }>;
            const errorMessage = axiosError.response?.data?.detail || axiosError.message || 'An unexpected error occurred';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, [url]);

    return { data, error, loading, execute };
}
