import {
    Card,
    CopyButton,
    Button,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
} from "@mantine/core";

import { ClientDetail } from "@/types/clients";

import { formatExactDate, formatRelativeDate } from "./dateUtils";
import styles from "./ClientOverviewCard.module.scss";

interface ClientOverviewCardProps {
    client: ClientDetail;
}

export default function ClientOverviewCard({ client }: ClientOverviewCardProps) {
    return (
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
    );
}
