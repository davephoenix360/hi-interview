import { AxiosInstance } from "axios";

import { ClientDetail, ClientListItem } from "@/types/clients";

export default class ClientsApi {
    private axiosInstance: AxiosInstance;

    constructor(axiosInstance: AxiosInstance) {
        this.axiosInstance = axiosInstance;
    }

    public listClients = async (): Promise<ClientListItem[]> => {
        const response = await this.axiosInstance.get<{ data: ClientListItem[] }>("client");
        return response.data.data;
    };

    public getClientById = async (clientId: string): Promise<ClientDetail> => {
        const response = await this.axiosInstance.get<{ data: ClientDetail }>(`client/${clientId}`);
        return response.data.data;
    };
}
