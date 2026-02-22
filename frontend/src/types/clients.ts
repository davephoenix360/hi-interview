export interface Client {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    assigned_user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface Advisor {
    id: string;
    email: string;
}

export interface NoteAuthor {
    id: string;
    email: string;
}

export interface Note {
    id: string;
    client_id: string;
    body: string;
    created_at: string;
    updated_at: string;
    author: NoteAuthor;
}

export interface ClientListItem extends Client {
    is_my_client: boolean;
    advisor_count: number;
}

export interface ClientDetail extends Client {
    is_my_client: boolean;
    advisors: Advisor[];
}
