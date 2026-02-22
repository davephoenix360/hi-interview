"use client";

import { Table, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useApi } from "@/api/context";
import { ClientListItem } from "@/types/clients";

import styles from "./page.module.scss";

export default function ClientsPage() {
    const router = useRouter();
    const api = useApi();
    const [clients, setClients] = useState<ClientListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.clients.listClients()
            .then(setClients)
            .finally(() => setLoading(false));
    }, [api]);

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

    const myClients = clients.filter(client => client.is_my_client);
    const otherClients = clients.filter(client => !client.is_my_client);

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
        <div className={styles.container}>
            <Title
                order={2}
                className={styles.title}
            >
                Clients
            </Title>
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
    );
}
