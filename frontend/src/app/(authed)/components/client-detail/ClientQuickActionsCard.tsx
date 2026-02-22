import { Button, Card, CopyButton, Group, Stack, Title } from "@mantine/core";

interface ClientQuickActionsCardProps {
    clientEmail: string;
}

export default function ClientQuickActionsCard({
    clientEmail,
}: ClientQuickActionsCardProps) {
    return (
        <Card
            withBorder
            radius="md"
            padding="lg">
            <Stack gap="sm">
                <Title order={4}>Quick actions</Title>
                <Group>
                    <CopyButton
                        value={clientEmail}
                        timeout={1500}>
                        {({ copied, copy }) => (
                            <Button
                                variant="light"
                                onClick={copy}>
                                {copied ? "Email copied" : "Copy email"}
                            </Button>
                        )}
                    </CopyButton>
                </Group>
            </Stack>
        </Card>
    );
}
