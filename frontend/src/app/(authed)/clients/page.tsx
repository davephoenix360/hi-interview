"use client";

import {
    Button,
    Group,
    Kbd,
    Notification,
    Table,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

import { useApi } from "@/api/context";
import { ClientListItem } from "@/types/clients";

import CreateClientModal, { CreateClientToast } from "./components/CreateClientModal";
import styles from "./page.module.scss";

type ToastState = {
    color: CreateClientToast["color"];
    title: CreateClientToast["title"];
    message: CreateClientToast["message"];
    id: number;
} | null;

export default function ClientsPage() {
    const router = useRouter();
    const api = useApi();
    const [clients, setClients] = useState<ClientListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMacKeyboard, setIsMacKeyboard] = useState(false);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const showToast = (nextToast: CreateClientToast) => {
        setToast({
            ...nextToast,
            id: Date.now(),
        });
    };

    useEffect(() => {
        let isCancelled = false;

        api.clients.listClients()
            .then(responseClients => {
                if (!isCancelled) {
                    setClients(responseClients);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [api]);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setToast(currentToast => (
                currentToast?.id === toast.id
                    ? null
                    : currentToast
            ));
        }, 4000);

        return () => window.clearTimeout(timeoutId);
    }, [toast]);

    useEffect(() => {
        if (typeof navigator === "undefined") {
            return;
        }

        setIsMacKeyboard(
            /Mac|iPhone|iPad|iPod/i.test(navigator.platform || "")
        );
    }, []);

    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
            if (!isShortcut || event.altKey || event.shiftKey || event.defaultPrevented) {
                return;
            }

            const activeElement = document.activeElement;
            if (
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement instanceof HTMLButtonElement ||
                (activeElement instanceof HTMLElement && activeElement.isContentEditable)
            ) {
                return;
            }

            event.preventDefault();
            searchInputRef.current?.focus();
        };

        window.addEventListener("keydown", handleGlobalKeyDown);

        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, []);

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const refreshClients = async () => {
        const refreshedClients = await api.clients.listClients();
        setClients(refreshedClients);
    };

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const hasSearchQuery = normalizedSearchQuery.length > 0;

    const matchesSearch = (client: ClientListItem) => {
        if (!hasSearchQuery) {
            return true;
        }

        return [client.first_name, client.last_name, client.email]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearchQuery);
    };

    const allMyClients = clients.filter(client => client.is_my_client);
    const allOtherClients = clients.filter(client => !client.is_my_client);
    const myClients = allMyClients.filter(matchesSearch);
    const otherClients = allOtherClients.filter(matchesSearch);
    const totalVisibleClients = myClients.length + otherClients.length;

    const formatSectionCount = (visibleCount: number, totalCount: number) => (
        hasSearchQuery
            ? `${visibleCount} of ${totalCount}`
            : `${totalCount}`
    );

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

    const renderTable = (items: ClientListItem[], emptyMessage: string) => {
        if (items.length === 0) {
            return (
                <Text
                    size="sm"
                    c="dimmed"
                    className={styles.emptyState}>
                    {emptyMessage}
                </Text>
            );
        }

        return (
            <Table
                striped
                highlightOnHover
                withTableBorder
                withColumnBorders
            >
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Assigned</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {items.map(client => (
                        <Table.Tr
                            key={client.id}
                            onClick={() => router.push(`/clients/${client.id}`)}
                            className={styles.clickableRow}
                        >
                            <Table.Td>{client.first_name} {client.last_name}</Table.Td>
                            <Table.Td>{client.email}</Table.Td>
                            <Table.Td>{client.assigned_user_id ? "Yes" : "No"}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        );
    };

    return (
        <>
            {toast && (
                <div className={styles.toastContainer}>
                    <Notification
                        withCloseButton
                        color={toast.color}
                        title={toast.title}
                        onClose={() => setToast(null)}>
                        {toast.message}
                    </Notification>
                </div>
            )}

            <div className={styles.container}>
                <div className={styles.header}>
                    <Group
                        justify="space-between"
                        align="flex-start"
                        wrap="wrap">
                        <div className={styles.headerContent}>
                            <Title
                                order={2}
                                className={styles.title}
                            >
                                Clients
                            </Title>
                            <Group
                                gap="md"
                                wrap="wrap"
                                className={styles.headerCounts}>
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    My Clients ({formatSectionCount(myClients.length, allMyClients.length)})
                                </Text>
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    Other Clients ({formatSectionCount(otherClients.length, allOtherClients.length)})
                                </Text>
                            </Group>
                        </div>
                        <Button onClick={openCreateModal}>New client</Button>
                    </Group>

                    <TextInput
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.currentTarget.value)}
                        placeholder="Search by first name, last name, or email"
                        leftSection={<IconSearch size={16} />}
                        rightSection={
                            <Group
                                gap={4}
                                wrap="nowrap"
                                className={styles.searchShortcutHint}>
                                <Kbd>{isMacKeyboard ? "Cmd" : "Ctrl"}</Kbd>
                                <Kbd>K</Kbd>
                            </Group>
                        }
                        rightSectionWidth={78}
                        rightSectionPointerEvents="none"
                        className={styles.searchInput}
                    />
                </div>

                {hasSearchQuery && totalVisibleClients === 0 && (
                    <div className={styles.section}>
                        <div className={styles.emptyState}>
                            <Text fw={500}>No matching clients</Text>
                            <Text
                                size="sm"
                                c="dimmed">
                                No clients match &quot;{searchQuery.trim()}&quot;. Try a different name or email.
                            </Text>
                        </div>
                    </div>
                )}

                {!(hasSearchQuery && totalVisibleClients === 0) && (
                    <>
                        <div className={styles.section}>
                            <Title
                                order={4}
                                className={styles.sectionTitle}>
                                My Clients
                            </Title>
                            {renderTable(
                                myClients,
                                hasSearchQuery
                                    ? "No matching clients in your advisory team."
                                    : "No clients on your advisory team yet."
                            )}
                        </div>
                        <div className={styles.section}>
                            <Title
                                order={4}
                                className={styles.sectionTitle}>
                                Other Clients
                            </Title>
                            {renderTable(
                                otherClients,
                                hasSearchQuery
                                    ? "No matching clients outside your advisory team."
                                    : "No other clients available."
                            )}
                        </div>
                    </>
                )}
            </div>

            <CreateClientModal
                opened={isCreateModalOpen}
                onClose={closeCreateModal}
                onCreated={refreshClients}
                onNotify={showToast}
            />
        </>
    );
}
