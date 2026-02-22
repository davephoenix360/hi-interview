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
