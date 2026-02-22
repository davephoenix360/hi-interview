import { Button, Card, CopyButton, Group, Stack, Title } from "@mantine/core";

interface ClientQuickActionsCardProps {
    clientEmail: string;
    compact?: boolean;
}

export default function ClientQuickActionsCard({
    clientEmail,
    compact = false,
}: ClientQuickActionsCardProps) {
    const copyEmailButton = (
        <CopyButton
            value={clientEmail}
            timeout={1500}>
            {({ copied, copy }) => (
                <Button
                    variant="light"
                    size={compact ? "xs" : "sm"}
                    onClick={copy}>
                    {copied ? "Email copied" : "Copy email"}
                </Button>
            )}
        </CopyButton>
    );

    if (compact) {
        return <Group gap="xs">{copyEmailButton}</Group>;
    }

    return (
        <Card
            withBorder
            radius="md"
            padding="lg">
            <Stack gap="sm">
                <Title order={4}>Quick actions</Title>
                <Group>{copyEmailButton}</Group>
            </Stack>
        </Card>
    );
}
