"use client";

import {
    Button,
    Group,
    Notification,
    Table,
    Text,
    Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

    const myClients = clients.filter(client => client.is_my_client);
    const otherClients = clients.filter(client => !client.is_my_client);

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
                <Group
                    justify="space-between"
                    align="center"
                    className={styles.header}>
                    <Title
                        order={2}
                        className={styles.title}
                    >
                        Clients
                    </Title>
                    <Button onClick={openCreateModal}>New client</Button>
                </Group>

                <div className={styles.section}>
                    <Title
                        order={4}
                        className={styles.sectionTitle}>
                        My Clients
                    </Title>
                    {renderTable(myClients, "No clients on your advisory team yet.")}
                </div>
                <div className={styles.section}>
                    <Title
                        order={4}
                        className={styles.sectionTitle}>
                        Other Clients
                    </Title>
                    {renderTable(otherClients, "No other clients available.")}
                </div>
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
