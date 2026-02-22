import axios, { AxiosInstance } from "axios";

import { AuthData, Me } from "@/types";

import ClientsApi from "./clients";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10001";
export const AUTH_DATA_KEY = "auth-data";

function storeAuthData(authData: AuthData) {
    localStorage.setItem(AUTH_DATA_KEY, JSON.stringify(authData));
}

function getAuthData(): AuthData | null {
    const data = localStorage.getItem(AUTH_DATA_KEY);

    if (!data) {
        return null;
    }

    return JSON.parse(data as string) as AuthData;
}

export default class Api {
    private axiosInstance: AxiosInstance;

    public clients: ClientsApi;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: BASE_URL,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.configureInterceptors();

        this.clients = new ClientsApi(this.axiosInstance);
    }

    private configureInterceptors() {
        this.axiosInstance.interceptors.request.use(config => {
            const authData = getAuthData();

            if (authData) {
                config.headers.Authorization = `Bearer ${authData.access_token}`;
            }

            return config;
        });

        this.axiosInstance.interceptors.response.use(
            response => response,
            async error => {
                if (
                    error.response?.status === 401 &&
                    error.config.url !== "token"
                ) {
                    storeAuthData({ access_token: "" });
                    window.location.href = "/login";
                }

                return Promise.reject(error);
            }
        );
    }

    public resetAuth = async (): Promise<void> => {
        storeAuthData({ access_token: "" });
    };

    public login = async (
        email: string,
        password: string
    ): Promise<void> => {
        const response = await this.axiosInstance.post("token", {
            email,
            password,
        });

        if (response.status === 200) {
            storeAuthData(response.data);
        }
    };

    public checkAuth = async (): Promise<boolean> => {
        return this.axiosInstance
            .get("check_auth")
            .then(() => true)
            .catch(() => {
                return false;
            });
    };

    public me = async (): Promise<Me> => {
        const response = await this.axiosInstance.get<{ data: Me }>("me");
        return response.data.data;
    };

}
