import { AxiosInstance } from "axios";

import { ClientDetail, ClientListItem, Note } from "@/types/clients";

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

    public joinAdvisoryTeam = async (clientId: string): Promise<ClientDetail> => {
        const response = await this.axiosInstance.post<{ data: ClientDetail }>(`client/${clientId}/advisors/me`);
        return response.data.data;
    };

    public listNotes = async (clientId: string): Promise<Note[]> => {
        const response = await this.axiosInstance.get<{ data: Note[] }>(`client/${clientId}/notes`);
        return response.data.data;
    };

    public createBlankNote = async (clientId: string): Promise<Note> => {
        const response = await this.axiosInstance.post<{ data: Note }>(`client/${clientId}/notes`);
        return response.data.data;
    };

    public updateNote = async (
        clientId: string,
        noteId: string,
        body: string
    ): Promise<Note> => {
        const response = await this.axiosInstance.patch<{ data: Note }>(
            `client/${clientId}/notes/${noteId}`,
            { body }
        );
        return response.data.data;
    };

    public deleteNote = async (
        clientId: string,
        noteId: string
    ): Promise<void> => {
        await this.axiosInstance.delete<{ data: Record<string, never> }>(
            `client/${clientId}/notes/${noteId}`
        );
    };
}
