"use client";

import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Alert,
    Badge,
    Button,
    Card,
    CopyButton,
    Group,
    Skeleton,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
} from "@mantine/core";

import { useApi } from "@/api/context";
import { ClientDetail } from "@/types/clients";

import styles from "./page.module.scss";

type ViewState = "loading" | "ready" | "not_found" | "error";

function formatRelativeDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown";
    }

    const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absDeltaSeconds = Math.abs(deltaSeconds);

    let value = deltaSeconds;
    let unit: Intl.RelativeTimeFormatUnit = "second";

    if (absDeltaSeconds >= 31536000) {
        value = Math.round(deltaSeconds / 31536000);
        unit = "year";
    } else if (absDeltaSeconds >= 2592000) {
        value = Math.round(deltaSeconds / 2592000);
        unit = "month";
    } else if (absDeltaSeconds >= 604800) {
        value = Math.round(deltaSeconds / 604800);
        unit = "week";
    } else if (absDeltaSeconds >= 86400) {
        value = Math.round(deltaSeconds / 86400);
        unit = "day";
    } else if (absDeltaSeconds >= 3600) {
        value = Math.round(deltaSeconds / 3600);
        unit = "hour";
    } else if (absDeltaSeconds >= 60) {
        value = Math.round(deltaSeconds / 60);
        unit = "minute";
    }

    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit);
}

function formatExactDate(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString();
}

export default function ClientDetailsPage() {
    const api = useApi();
    const router = useRouter();
    const params = useParams<{ id?: string | string[] }>();

    const clientId = useMemo(() => {
        if (!params?.id) {
            return "";
        }
        return Array.isArray(params.id) ? params.id[0] : params.id;
    }, [params]);

    const [client, setClient] = useState<ClientDetail | null>(null);
    const [viewState, setViewState] = useState<ViewState>("loading");

    useEffect(() => {
        if (!clientId) {
            setViewState("error");
            return;
        }

        setViewState("loading");
        setClient(null);

        api.clients
            .getClientById(clientId)
            .then(responseClient => {
                setClient(responseClient);
                setViewState("ready");
            })
            .catch(requestError => {
                if (isAxiosError(requestError) && requestError.response?.status === 404) {
                    setViewState("not_found");
                    return;
                }

                setViewState("error");
            });
    }, [api, clientId]);

    if (viewState === "loading") {
        return (
            <div className={styles.container}>
                <Stack gap="lg">
                    <Group
                        justify="space-between"
                        align="center">
                        <Skeleton
                            height={36}
                            width={220} />
                        <Skeleton
                            height={28}
                            width={120} />
                    </Group>
                    <Card
                        withBorder
                        radius="md"
                        padding="lg">
                        <Stack gap="md">
                            <Skeleton
                                height={20}
                                width={140} />
                            <Skeleton height={36} />
                            <Skeleton
                                height={20}
                                width={140} />
                            <Skeleton
                                height={30}
                                width={220} />
                            <Skeleton
                                height={20}
                                width={160} />
                            <Skeleton
                                height={20}
                                width={200} />
                        </Stack>
                    </Card>
                    <Card
                        withBorder
                        radius="md"
                        padding="lg">
                        <Stack gap="sm">
                            <Skeleton
                                height={20}
                                width={120} />
                            <Group>
                                <Skeleton
                                    height={32}
                                    width={120} />
                                <Skeleton
                                    height={32}
                                    width={120} />
                            </Group>
                        </Stack>
                    </Card>
                </Stack>
            </div>
        );
    }

    if (viewState === "not_found") {
        return (
            <div className={styles.container}>
                <Stack
                    gap="md"
                    className={styles.stateContainer}>
                    <Alert
                        color="yellow"
                        title="Client not found">
                        We could not find a client with this ID.
                    </Alert>
                    <Button
                        variant="light"
                        onClick={() => router.push("/clients")}>
                        Back to clients
                    </Button>
                </Stack>
            </div>
        );
    }

    if (viewState === "error" || !client) {
        return (
            <div className={styles.container}>
                <Alert
                    color="red"
                    title="Something went wrong">
                    We could not load this client right now. Please try again.
                </Alert>
            </div>
        );
    }

    const fullName = `${client.first_name} ${client.last_name}`;
    const isAssigned = Boolean(client.assigned_user_id);

    return (
        <div className={styles.container}>
            <Stack gap="lg">
                <Group
                    justify="space-between"
                    align="center">
                    <Title order={2}>{fullName}</Title>
                    <Badge
                        color={isAssigned ? "green" : "gray"}
                        variant="light">
                        {isAssigned ? "Assigned" : "Unassigned"}
                    </Badge>
                </Group>

                <Card
                    withBorder
                    radius="md"
                    padding="lg">
                    <Stack gap="md">
                        <Text
                            size="sm"
                            c="dimmed">Email</Text>
                        <Group
                            justify="space-between"
                            wrap="wrap">
                            <Text>{client.email}</Text>
                            <CopyButton
                                value={client.email}
                                timeout={1500}>
                                {({ copied, copy }) => (
                                    <Button
                                        variant="light"
                                        size="xs"
                                        onClick={copy}>
                                        {copied ? "Copied" : "Copy"}
                                    </Button>
                                )}
                            </CopyButton>
                        </Group>

                        <Text
                            size="sm"
                            c="dimmed">Client ID</Text>
                        <Group
                            justify="space-between"
                            wrap="wrap">
                            <Text
                                size="xs"
                                ff="monospace"
                                className={styles.clientId}>
                                {client.id}
                            </Text>
                            <CopyButton
                                value={client.id}
                                timeout={1500}>
                                {({ copied, copy }) => (
                                    <Button
                                        variant="default"
                                        size="xs"
                                        onClick={copy}>
                                        {copied ? "Copied" : "Copy ID"}
                                    </Button>
                                )}
                            </CopyButton>
                        </Group>

                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <Stack gap={4}>
                                <Text
                                    size="sm"
                                    c="dimmed">Created</Text>
                                <Tooltip
                                    label={formatExactDate(client.created_at)}
                                    withArrow>
                                    <Text>{formatRelativeDate(client.created_at)}</Text>
                                </Tooltip>
                            </Stack>
                            <Stack gap={4}>
                                <Text
                                    size="sm"
                                    c="dimmed">Updated</Text>
                                <Tooltip
                                    label={formatExactDate(client.updated_at)}
                                    withArrow>
                                    <Text>{formatRelativeDate(client.updated_at)}</Text>
                                </Tooltip>
                            </Stack>
                        </SimpleGrid>
                    </Stack>
                </Card>

                <Card
                    withBorder
                    radius="md"
                    padding="lg">
                    <Stack gap="sm">
                        <Title order={4}>Quick actions</Title>
                        <Group>
                            <CopyButton
                                value={client.email}
                                timeout={1500}>
                                {({ copied, copy }) => (
                                    <Button
                                        variant="light"
                                        onClick={copy}>
                                        {copied ? "Email copied" : "Copy email"}
                                    </Button>
                                )}
                            </CopyButton>
                            <Button
                                disabled
                                variant="default">
                                Add note
                            </Button>
                        </Group>
                        <Text
                            size="xs"
                            c="dimmed">
                            Coming in Task 2
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        </div>
    );
}
