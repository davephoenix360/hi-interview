"use client";

import { isAxiosError } from "axios";
import {
    Alert,
    Button,
    Checkbox,
    Group,
    Modal,
    Stack,
    TextInput,
} from "@mantine/core";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useApi } from "@/api/context";
import { ClientCreatePayload, ClientDetail } from "@/types/clients";

import styles from "./CreateClientModal.module.scss";

type CreateClientFieldErrors = Partial<Record<"first_name" | "last_name" | "email", string>>;

export interface CreateClientToast {
    color: "teal" | "red";
    title: string;
    message: string;
}

interface CreateClientModalProps {
    opened: boolean;
    onClose: () => void;
    onCreated: (createdClient: ClientDetail) => Promise<void> | void;
    onNotify: (toast: CreateClientToast) => void;
}

const DEFAULT_CREATE_FORM: ClientCreatePayload = {
    first_name: "",
    last_name: "",
    email: "",
    add_me_as_advisor: true,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function CreateClientModal({
    opened,
    onClose,
    onCreated,
    onNotify,
}: CreateClientModalProps) {
    const api = useApi();
    const router = useRouter();

    const [form, setForm] = useState<ClientCreatePayload>(DEFAULT_CREATE_FORM);
    const [fieldErrors, setFieldErrors] = useState<CreateClientFieldErrors>({});
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [creatingClient, setCreatingClient] = useState(false);

    useEffect(() => {
        if (!opened) {
            return;
        }

        setForm(DEFAULT_CREATE_FORM);
        setFieldErrors({});
        setInlineError(null);
        setCreatingClient(false);
    }, [opened]);

    const validateForm = (values: ClientCreatePayload): CreateClientFieldErrors => {
        const errors: CreateClientFieldErrors = {};

        if (!values.first_name.trim()) {
            errors.first_name = "First name is required.";
        }
        if (!values.last_name.trim()) {
            errors.last_name = "Last name is required.";
        }
        if (!values.email.trim()) {
            errors.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(values.email.trim())) {
            errors.email = "Enter a valid email address.";
        }

        return errors;
    };

    const handleClose = () => {
        if (creatingClient) {
            return;
        }
        onClose();
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (creatingClient) {
            return;
        }

        const validationErrors = validateForm(form);
        setFieldErrors(validationErrors);
        setInlineError(null);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setCreatingClient(true);

        try {
            const createdClient = await api.clients.createClient({
                email: normalizeEmail(form.email),
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                add_me_as_advisor: form.add_me_as_advisor,
            });

            onNotify({
                color: "teal",
                title: "Client created",
                message: `${createdClient.first_name} ${createdClient.last_name} was added successfully.`,
            });

            try {
                await onCreated(createdClient);
            } catch {
                onNotify({
                    color: "red",
                    title: "Client created",
                    message: "Client was created, but the list could not be refreshed.",
                });
            }

            onClose();
            router.push(`/clients/${createdClient.id}`);
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 409) {
                setInlineError("A client with this email already exists.");
                return;
            }

            onNotify({
                color: "red",
                title: "Could not create client",
                message: "Something went wrong. Please try again.",
            });
        } finally {
            setCreatingClient(false);
        }
    };

    const handleFormKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
        if (
            event.key !== "Enter" ||
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.shiftKey
        ) {
            return;
        }

        const target = event.target;
        if (!(target instanceof HTMLElement) || target.isContentEditable) {
            return;
        }

        if (target instanceof HTMLTextAreaElement) {
            return;
        }

        if (!(target instanceof HTMLInputElement)) {
            return;
        }

        event.preventDefault();

        if (creatingClient) {
            return;
        }

        event.currentTarget.requestSubmit();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="New client"
            closeOnClickOutside={!creatingClient}
            closeOnEscape={!creatingClient}>
            <form
                onSubmit={handleSubmit}
                onKeyDown={handleFormKeyDown}
                className={styles.form}>
                <Stack gap="md">
                    <TextInput
                        label="First name"
                        placeholder="Jane"
                        value={form.first_name}
                        onChange={event => {
                            const nextFirstName = event.currentTarget.value;
                            setForm(current => ({
                                ...current,
                                first_name: nextFirstName,
                            }));
                            setFieldErrors(current => ({
                                ...current,
                                first_name: undefined,
                            }));
                        }}
                        error={fieldErrors.first_name}
                        required
                    />
                    <TextInput
                        label="Last name"
                        placeholder="Doe"
                        value={form.last_name}
                        onChange={event => {
                            const nextLastName = event.currentTarget.value;
                            setForm(current => ({
                                ...current,
                                last_name: nextLastName,
                            }));
                            setFieldErrors(current => ({
                                ...current,
                                last_name: undefined,
                            }));
                        }}
                        error={fieldErrors.last_name}
                        required
                    />
                    <TextInput
                        label="Email"
                        type="email"
                        placeholder="jane@example.com"
                        value={form.email}
                        onChange={event => {
                            const nextEmail = event.currentTarget.value.toLowerCase();
                            setForm(current => ({
                                ...current,
                                email: nextEmail,
                            }));
                            setFieldErrors(current => ({
                                ...current,
                                email: undefined,
                            }));
                            setInlineError(null);
                        }}
                        onBlur={event => {
                            const normalizedEmail = normalizeEmail(event.currentTarget.value);
                            setForm(current => ({
                                ...current,
                                email: normalizedEmail,
                            }));
                        }}
                        error={fieldErrors.email}
                        required
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="off"
                    />
                    <Checkbox
                        label="Add me as advisor"
                        checked={form.add_me_as_advisor}
                        onChange={event => {
                            const nextChecked = event.currentTarget.checked;
                            setForm(current => ({
                                ...current,
                                add_me_as_advisor: nextChecked,
                            }));
                        }}
                    />

                    {inlineError && (
                        <Alert
                            color="red"
                            title="Could not create client">
                            {inlineError}
                        </Alert>
                    )}

                    <Group
                        justify="flex-end"
                        className={styles.actions}>
                        <Button
                            variant="default"
                            onClick={handleClose}
                            disabled={creatingClient}
                            type="button">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={creatingClient}
                            disabled={creatingClient}>
                            Create client
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
