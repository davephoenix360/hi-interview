"use client";

import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Skeleton,
    Stack,
    Text,
    Tooltip,
    Title,
} from "@mantine/core";

import { useApi } from "@/api/context";
import ClientNotesSection, {
    type ClientNotesSnapshotState,
} from "@/app/(authed)/components/client-detail/ClientNotesSection";
import ClientOverviewCard from "@/app/(authed)/components/client-detail/ClientOverviewCard";
import ClientQuickActionsCard from "@/app/(authed)/components/client-detail/ClientQuickActionsCard";
import { formatExactDate, formatRelativeDate } from "@/app/(authed)/components/client-detail/dateUtils";
import { ClientDetail } from "@/types/clients";

import styles from "./page.module.scss";

type ViewState = "loading" | "ready" | "not_found" | "error";

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
    const [joiningTeam, setJoiningTeam] = useState(false);
    const [joinTeamError, setJoinTeamError] = useState<string | null>(null);
    const [isAdvisoryTeamExpanded, setIsAdvisoryTeamExpanded] = useState(true);
    const [notesSnapshot, setNotesSnapshot] = useState<ClientNotesSnapshotState>({
        notes: [],
        loading: true,
    });

    useEffect(() => {
        if (!clientId) {
            setViewState("error");
            return;
        }

        setViewState("loading");
        setClient(null);
        setJoinTeamError(null);

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

    useEffect(() => {
        setNotesSnapshot({
            notes: [],
            loading: true,
        });
    }, [clientId]);

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
    const lastNoteTimestamp = notesSnapshot.notes.reduce<string | null>((latestTimestamp, note) => {
        const candidateTimestamp = note.updated_at || note.created_at;

        if (!latestTimestamp) {
            return candidateTimestamp;
        }

        return new Date(candidateTimestamp).getTime() > new Date(latestTimestamp).getTime()
            ? candidateTimestamp
            : latestTimestamp;
    }, null);

    const handleJoinAdvisoryTeam = async () => {
        setJoiningTeam(true);
        setJoinTeamError(null);

        try {
            const updatedClient = await api.clients.joinAdvisoryTeam(client.id);
            setClient(updatedClient);
        } catch {
            setJoinTeamError("Unable to join advisory team right now. Please try again.");
        } finally {
            setJoiningTeam(false);
        }
    };

    return (
        <div className={styles.container}>
            <Stack gap="lg">
                <Stack gap="xs">
                    <Group>
                        <Button
                            variant="subtle"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => router.push("/clients")}>
                            Back to clients
                        </Button>
                    </Group>
                    <Group
                        justify="space-between"
                        align="center"
                        wrap="wrap">
                        <Title order={2}>{fullName}</Title>
                        <ClientQuickActionsCard
                            compact
                            clientEmail={client.email} />
                    </Group>
                </Stack>

                <Card
                    withBorder
                    radius="md"
                    padding="lg"
                    className={styles.sectionCard}>
                    <Stack gap="sm">
                        <Text fw={600}>Client Snapshot</Text>
                        <Divider />
                        <Group
                            grow
                            align="flex-start"
                            wrap="wrap"
                            className={styles.snapshotRow}>
                            <Stack
                                gap={2}
                                className={styles.snapshotItem}>
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    Total notes
                                </Text>
                                {notesSnapshot.loading ? (
                                    <Skeleton
                                        height={18}
                                        width={48} />
                                ) : (
                                    <Text fw={500}>{notesSnapshot.notes.length}</Text>
                                )}
                            </Stack>
                            <Stack
                                gap={2}
                                className={styles.snapshotItem}>
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    Last note
                                </Text>
                                {notesSnapshot.loading ? (
                                    <Skeleton
                                        height={18}
                                        width={120} />
                                ) : lastNoteTimestamp ? (
                                    <Tooltip
                                        label={formatExactDate(lastNoteTimestamp)}
                                        withArrow>
                                        <Text fw={500}>
                                            {formatRelativeDate(lastNoteTimestamp)}
                                        </Text>
                                    </Tooltip>
                                ) : (
                                    <Text
                                        fw={500}
                                        c="dimmed">
                                        No notes yet
                                    </Text>
                                )}
                            </Stack>
                        </Group>
                        <Divider />
                        <Group
                            grow
                            align="flex-start"
                            wrap="wrap"
                            className={styles.snapshotRow}>
                            <Stack
                                gap={2}
                                className={styles.snapshotItem}>
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    Advisors
                                </Text>
                                <Text fw={500}>{client.advisors.length}</Text>
                            </Stack>
                            <Stack
                                gap={2}
                                className={styles.snapshotItem}>
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    Member since
                                </Text>
                                <Tooltip
                                    label={formatExactDate(client.created_at)}
                                    withArrow>
                                    <Text fw={500}>
                                        {formatRelativeDate(client.created_at)}
                                    </Text>
                                </Tooltip>
                            </Stack>
                        </Group>
                    </Stack>
                </Card>

                <Divider />

                <Stack
                    gap="sm"
                    className={styles.sectionBlock}>
                    <Group
                        justify="space-between"
                        align="center"
                        wrap="wrap"
                        className={styles.sectionHeader}>
                        <Title order={4}>Client info</Title>
                    </Group>
                    <ClientOverviewCard client={client} />
                </Stack>

                <Divider />

                <Card
                    withBorder
                    radius="md"
                    padding="lg"
                    className={styles.sectionCard}>
                    <Stack gap="xs">
                        <Group
                            justify="space-between"
                            align="center"
                            wrap="wrap"
                            className={styles.sectionHeader}>
                            <Group
                                gap="xs"
                                wrap="wrap"
                                className={styles.advisorsTitleRow}>
                                <Title order={4}>Advisors</Title>
                                <Badge
                                    variant="light"
                                    color="gray"
                                    className={styles.advisorCount}>
                                    {client.advisors.length}
                                </Badge>
                                <Button
                                    variant="subtle"
                                    size="compact-sm"
                                    px={6}
                                    aria-label={isAdvisoryTeamExpanded ? "Minimize advisory team" : "Maximize advisory team"}
                                    onClick={() => setIsAdvisoryTeamExpanded(expanded => !expanded)}>
                                    {isAdvisoryTeamExpanded ? <IconChevronUp stroke={2} /> : <IconChevronDown stroke={2} />}
                                </Button>
                            </Group>
                            {!client.is_my_client && (
                                <Button
                                    size="sm"
                                    onClick={handleJoinAdvisoryTeam}
                                    loading={joiningTeam}>
                                    Join advisory team
                                </Button>
                            )}
                        </Group>
                        {joinTeamError && (
                            <Alert
                                color="red"
                                title="Could not join team">
                                {joinTeamError}
                            </Alert>
                        )}
                        {isAdvisoryTeamExpanded && (
                            client.advisors.length === 0 ? (
                                <Text
                                    size="sm"
                                    c="dimmed">
                                    No advisors on this client yet.
                                </Text>
                            ) : (
                                <Stack
                                    gap={6}
                                    className={styles.advisorList}>
                                    {client.advisors.map(advisor => (
                                        <Group
                                            key={advisor.id}
                                            justify="space-between"
                                            className={styles.advisorRow}>
                                            <div className={styles.advisorIdentity}>
                                                <Text className={styles.advisorEmail}>
                                                    {advisor.email}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    ff="monospace">
                                                    {advisor.id}
                                                </Text>
                                            </div>
                                            <Badge
                                                variant="light"
                                                color={advisor.id === client.assigned_user_id ? "green" : "gray"}>
                                                {advisor.id === client.assigned_user_id ? "Assigned" : "Advisor"}
                                            </Badge>
                                        </Group>
                                    ))}
                                </Stack>
                            )
                        )}
                    </Stack>
                </Card>

                <Divider />

                <ClientNotesSection
                    clientId={client.id}
                    onNotesSnapshotChange={setNotesSnapshot}
                />
            </Stack>
        </div>
    );
}
