export interface AuthData {
    access_token: string;
}

export interface Me {
    id: string;
    email: string;
}

export interface ApiError {
    detail: string;
}

export type {
    Advisor,
    Client,
    ClientDetail,
    ClientListItem,
    Note,
    NoteAuthor,
} from "./clients";
