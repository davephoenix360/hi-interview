"use client";

import { isAxiosError } from "axios";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import {
    Alert,
    Button,
    Card,
    Divider,
    Group,
    Modal,
    Skeleton,
    Stack,
    Text,
    Textarea,
    Timeline,
    Title,
    Tooltip,
    UnstyledButton,
} from "@mantine/core";

import { useApi } from "@/api/context";
import type { Me } from "@/types";
import { Note } from "@/types/clients";

import { formatExactDate, formatRelativeDate } from "./dateUtils";
import styles from "./ClientNotesSection.module.scss";

type NoteModalMode = "view" | "edit";
type NoteTimelineGroupKey = "today" | "this_week" | "older";

export interface ClientNotesSnapshotState {
    notes: Note[];
    loading: boolean;
}

interface ClientNotesSectionProps {
    clientId: string;
    onNotesSnapshotChange?: (snapshot: ClientNotesSnapshotState) => void;
}

function getNotePreview(body: string): string {
    const normalized = body.replace(/\r\n?/g, "\n").trim();

    if (!normalized) {
        return "Empty note";
    }

    return normalized;
}

function getNoteTimestampSource(note: Note): string {
    return note.updated_at !== note.created_at
        ? note.updated_at
        : note.created_at;
}

function isSameLocalDay(left: Date, right: Date): boolean {
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

function getStartOfLocalWeek(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return start;
}

function getNoteTimelineGroup(createdAt: string, now: Date): NoteTimelineGroupKey {
    const createdDate = new Date(createdAt);

    if (isSameLocalDay(createdDate, now)) {
        return "today";
    }

    if (createdDate >= getStartOfLocalWeek(now)) {
        return "this_week";
    }

    return "older";
}

export default function ClientNotesSection({
    clientId,
    onNotesSnapshotChange,
}: ClientNotesSectionProps) {
    const api = useApi();

    const [notes, setNotes] = useState<Note[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [notesActionError, setNotesActionError] = useState<string | null>(null);
    const [notesActionNotice, setNotesActionNotice] = useState<{
        color: "green" | "red";
        title: string;
        message: string;
    } | null>(null);
    const [creatingNote, setCreatingNote] = useState(false);
    const [me, setMe] = useState<Me | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteModalMode, setNoteModalMode] = useState<NoteModalMode>("view");
    const [noteDraftBody, setNoteDraftBody] = useState("");
    const [noteModalError, setNoteModalError] = useState<string | null>(null);
    const [savingNote, setSavingNote] = useState(false);
    const [deletingNote, setDeletingNote] = useState(false);
    const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        let isCancelled = false;

        api.me()
            .then(currentUser => {
                if (!isCancelled) {
                    setMe(currentUser);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setMe(null);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [api]);

    useEffect(() => {
        if (!notesActionNotice) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setNotesActionNotice(null);
        }, 4000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [notesActionNotice]);

    useEffect(() => {
        onNotesSnapshotChange?.({
            notes,
            loading: notesLoading,
        });
    }, [notes, notesLoading, onNotesSnapshotChange]);

    useEffect(() => {
        if (!clientId) {
            setNotes([]);
            setNotesLoading(false);
            setNotesError("Missing client ID.");
            return;
        }

        let isCancelled = false;

        setNotesLoading(true);
        setNotesError(null);
        setNotesActionError(null);

        api.clients
            .listNotes(clientId)
            .then(responseNotes => {
                if (!isCancelled) {
                    setNotes(responseNotes);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setNotes([]);
                    setNotesError("Unable to load notes right now. Please try again.");
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setNotesLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [api, clientId]);

    useEffect(() => {
        if (!isNoteModalOpen || noteModalMode !== "edit") {
            return;
        }

        const textarea = noteTextareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }, [isNoteModalOpen, noteModalMode, selectedNote?.id]);

    const getRequestErrorMessage = (error: unknown, fallbackMessage: string): string => {
        if (!isAxiosError(error)) {
            return fallbackMessage;
        }

        const detail = error.response?.data?.detail;
        if (typeof detail === "string") {
            return detail;
        }

        if (Array.isArray(detail)) {
            return (
                detail
                    .map(item => (typeof item?.msg === "string" ? item.msg : null))
                    .filter(Boolean)
                    .join(". ") || fallbackMessage
            );
        }

        return fallbackMessage;
    };

    const refreshNotes = async (showLoadingSkeleton = false) => {
        if (!clientId) {
            return;
        }

        if (showLoadingSkeleton) {
            setNotesLoading(true);
        }
        setNotesError(null);

        try {
            const refreshedNotes = await api.clients.listNotes(clientId);
            setNotes(refreshedNotes);
        } catch {
            setNotesError("Unable to load notes right now. Please try again.");
        } finally {
            if (showLoadingSkeleton) {
                setNotesLoading(false);
            }
        }
    };

    const openNoteModal = (note: Note, mode: NoteModalMode = "view") => {
        setSelectedNote(note);
        setNoteDraftBody(note.body);
        setNoteModalMode(mode);
        setNoteModalError(null);
        setIsNoteModalOpen(true);
    };

    const closeNoteModal = () => {
        setIsNoteModalOpen(false);
        setSelectedNote(null);
        setNoteDraftBody("");
        setNoteModalMode("view");
        setNoteModalError(null);
    };

    const handleNewNote = async () => {
        setCreatingNote(true);
        setNotesActionError(null);

        try {
            const newNote = await api.clients.createBlankNote(clientId);

            setNotes(currentNotes => [newNote, ...currentNotes]);
            openNoteModal(newNote, "edit");

            void refreshNotes();
        } catch (error) {
            setNotesActionError(
                getRequestErrorMessage(
                    error,
                    "Unable to create a note right now. Please try again."
                )
            );
        } finally {
            setCreatingNote(false);
        }
    };

    const getNoteAuthorLabel = (note: Note): string => note.author?.email ?? "Deleted advisor";

    const isSelectedNoteAuthor =
        selectedNote !== null &&
        me !== null &&
        selectedNote.author_user_id !== null &&
        selectedNote.author_user_id === me.id;

    const handleSaveNote = async () => {
        if (!selectedNote || savingNote || deletingNote) {
            return;
        }

        setSavingNote(true);
        setNoteModalError(null);

        try {
            await api.clients.updateNote(clientId, selectedNote.id, noteDraftBody);
            await refreshNotes();
            closeNoteModal();
        } catch (error) {
            setNoteModalError(
                getRequestErrorMessage(
                    error,
                    "Unable to save note right now. Please try again."
                )
            );
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async () => {
        if (!selectedNote || deletingNote || savingNote) {
            return;
        }

        const noteId = selectedNote.id;
        const confirmed = window.confirm("Delete this note? This action cannot be undone.");
        if (!confirmed) {
            return;
        }

        setDeletingNote(true);
        setNoteModalError(null);
        setNotesActionNotice(null);

        try {
            await api.clients.deleteNote(clientId, noteId);
            setNotes(currentNotes =>
                currentNotes.filter(note => note.id !== noteId)
            );
            closeNoteModal();
            setNotesActionNotice({
                color: "green",
                title: "Note deleted",
                message: "The note was deleted successfully.",
            });
            await refreshNotes();
        } catch (error) {
            const message = getRequestErrorMessage(
                error,
                "Unable to delete note right now. Please try again."
            );
            setNoteModalError(
                message
            );
            setNotesActionNotice({
                color: "red",
                title: "Delete failed",
                message,
            });
        } finally {
            setDeletingNote(false);
        }
    };

    const handleNoteTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            if (!savingNote && !deletingNote) {
                void handleSaveNote();
            }
        }
    };

    return (
        <>
            <Card
                withBorder
                radius="md"
                padding="lg">
                <Stack gap="md">
                    <Group
                        justify="space-between"
                        align="center"
                        wrap="wrap">
                        <Title order={4}>Notes</Title>
                        <Button
                            onClick={handleNewNote}
                            loading={creatingNote}>
                            New note
                        </Button>
                    </Group>

                    {notesActionError && (
                        <Alert
                            color="red"
                            title="Could not create note">
                            {notesActionError}
                        </Alert>
                    )}

                    {notesActionNotice && (
                        <Alert
                            color={notesActionNotice.color}
                            title={notesActionNotice.title}>
                            {notesActionNotice.message}
                        </Alert>
                    )}

                    {notesError && (
                        <Alert
                            color="red"
                            title="Could not load notes">
                            {notesError}
                        </Alert>
                    )}

                    {notesLoading ? (
                        <Stack gap="sm">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Card
                                    key={`note-skeleton-${index}`}
                                    withBorder
                                    radius="md"
                                    padding="md">
                                    <Stack gap="xs">
                                        <Group justify="space-between">
                                            <Skeleton
                                                height={16}
                                                width={180} />
                                            <Skeleton
                                                height={14}
                                                width={100} />
                                        </Group>
                                        <Skeleton
                                            height={14}
                                            width="90%" />
                                        <Skeleton
                                            height={14}
                                            width="75%" />
                                    </Stack>
                                </Card>
                            ))}
                        </Stack>
                    ) : notes.length === 0 ? (
                        <div className={styles.notesEmptyState}>
                            <Text fw={500}>No notes yet</Text>
                            <Text
                                size="sm"
                                c="dimmed">
                                Add the first note to capture context for this client.
                            </Text>
                        </div>
                    ) : (
                        (() => {
                            const now = new Date();
                            const sortedNotes = [...notes].sort(
                                (a, b) =>
                                    new Date(b.created_at).getTime() -
                                    new Date(a.created_at).getTime()
                            );
                            const groupedNotes: Record<NoteTimelineGroupKey, Note[]> = {
                                today: [],
                                this_week: [],
                                older: [],
                            };

                            sortedNotes.forEach(note => {
                                groupedNotes[getNoteTimelineGroup(note.created_at, now)].push(note);
                            });

                            const groupDefinitions: Array<{
                                key: NoteTimelineGroupKey;
                                label: string;
                            }> = [
                                { key: "today", label: "Today" },
                                { key: "this_week", label: "This week" },
                                { key: "older", label: "Older" },
                            ];

                            return (
                                <Stack gap="xs">
                                    {groupDefinitions.map(group => {
                                        const groupNotes = groupedNotes[group.key];

                                        if (groupNotes.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <Stack
                                                key={group.key}
                                                gap={6}
                                                className={styles.noteTimelineSection}>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    fw={600}>
                                                    {group.label}
                                                </Text>
                                                <Timeline
                                                    align="left"
                                                    bulletSize={14}
                                                    lineWidth={2}
                                                    className={styles.noteTimeline}>
                                                    {groupNotes.map(note => {
                                                        const timestampSource = getNoteTimestampSource(note);
                                                        const timestampLabel =
                                                            note.updated_at !== note.created_at
                                                                ? `Edited ${formatRelativeDate(timestampSource)}`
                                                                : formatRelativeDate(timestampSource);

                                                        return (
                                                            <Timeline.Item
                                                                key={note.id}
                                                                className={styles.noteTimelineItem}>
                                                                <UnstyledButton
                                                                    className={styles.noteTimelineButton}
                                                                    onClick={() => openNoteModal(note)}>
                                                                    <Stack gap={4}>
                                                                        <Group
                                                                            justify="space-between"
                                                                            align="center"
                                                                            wrap="wrap"
                                                                            className={styles.noteCardMetaRow}>
                                                                            <Text
                                                                                fw={500}
                                                                                size="sm"
                                                                                className={styles.noteCardAuthor}>
                                                                                {getNoteAuthorLabel(note)}
                                                                            </Text>
                                                                            <Tooltip
                                                                                label={formatExactDate(timestampSource)}
                                                                                withArrow>
                                                                                <Text
                                                                                    size="xs"
                                                                                    c="dimmed"
                                                                                    className={styles.noteCardTimestamp}>
                                                                                    {timestampLabel}
                                                                                </Text>
                                                                            </Tooltip>
                                                                        </Group>
                                                                        <Text
                                                                            size="sm"
                                                                            c={note.body.trim() ? undefined : "dimmed"}
                                                                            className={styles.preview}>
                                                                            {getNotePreview(note.body)}
                                                                        </Text>
                                                                    </Stack>
                                                                </UnstyledButton>
                                                            </Timeline.Item>
                                                        );
                                                    })}
                                                </Timeline>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            );
                        })()
                    )}
                </Stack>
            </Card>

            <Modal
                opened={isNoteModalOpen}
                onClose={closeNoteModal}
                title="Client note"
                size="lg"
                closeOnClickOutside={!savingNote && !deletingNote}
                closeOnEscape={!savingNote && !deletingNote}>
                {selectedNote && (
                    <Stack gap="md">
                        <Group
                            justify="space-between"
                            align="center"
                            wrap="wrap">
                            <Group
                                gap="sm"
                                wrap="wrap"
                                className={styles.noteModalMetaRow}>
                                <Text
                                    fw={600}
                                    className={styles.noteModalAuthor}>
                                    {getNoteAuthorLabel(selectedNote)}
                                </Text>
                                <Tooltip
                                    label={formatExactDate(selectedNote.updated_at)}
                                    withArrow>
                                    <Text
                                        size="sm"
                                        c="dimmed"
                                        className={styles.noteModalTimestamp}>
                                        {selectedNote.updated_at !== selectedNote.created_at
                                            ? `Edited ${formatRelativeDate(selectedNote.updated_at)}`
                                            : formatRelativeDate(selectedNote.created_at)}
                                    </Text>
                                </Tooltip>
                            </Group>
                            {isSelectedNoteAuthor && noteModalMode === "view" && (
                                <Button
                                    variant="default"
                                    size="xs"
                                    disabled={savingNote || deletingNote}
                                    onClick={() => {
                                        setNoteDraftBody(selectedNote.body);
                                        setNoteModalError(null);
                                        setNoteModalMode("edit");
                                    }}>
                                    Edit
                                </Button>
                            )}
                        </Group>

                        <Divider />

                        {noteModalError && (
                            <Alert
                                color="red"
                                title="Request failed">
                                {noteModalError}
                            </Alert>
                        )}

                        {noteModalMode === "edit" && isSelectedNoteAuthor ? (
                            <Stack gap="xs">
                                <Textarea
                                    ref={noteTextareaRef}
                                    value={noteDraftBody}
                                    onChange={event => setNoteDraftBody(event.currentTarget.value)}
                                    onKeyDown={handleNoteTextareaKeyDown}
                                    minRows={8}
                                    autosize
                                    maxLength={10000}
                                    placeholder="Write note details..."
                                />
                                <Group
                                    justify="space-between"
                                    align="center">
                                    <Text
                                        size="xs"
                                        c="dimmed">
                                        Press Ctrl/Cmd + Enter to save
                                    </Text>
                                    <Text
                                        size="xs"
                                        c={noteDraftBody.length > 9500 ? "orange" : "dimmed"}>
                                        {noteDraftBody.length}/10000
                                    </Text>
                                </Group>
                            </Stack>
                        ) : (
                            <div className={styles.noteBody}>
                                <Text
                                    size="sm"
                                    c={selectedNote.body.trim() ? undefined : "dimmed"}
                                    className={styles.noteBodyText}>
                                    {selectedNote.body.trim()
                                        ? selectedNote.body
                                        : "This note is empty."}
                                </Text>
                            </div>
                        )}

                        <Group
                            justify="space-between"
                            align="center"
                            wrap="wrap">
                            <Group gap="xs">
                                {isSelectedNoteAuthor && (
                                    <Button
                                        color="red"
                                        variant="light"
                                        leftSection={<IconTrash size={16} />}
                                        onClick={handleDeleteNote}
                                        loading={deletingNote}
                                        disabled={savingNote || deletingNote}>
                                        Delete
                                    </Button>
                                )}
                            </Group>
                            <Group gap="xs">
                                {noteModalMode === "edit" && isSelectedNoteAuthor && (
                                    <Button
                                        variant="default"
                                        onClick={() => {
                                            setNoteDraftBody(selectedNote.body);
                                            setNoteModalError(null);
                                            setNoteModalMode("view");
                                        }}
                                        disabled={savingNote || deletingNote}>
                                        Cancel
                                    </Button>
                                )}
                                {noteModalMode === "edit" && isSelectedNoteAuthor ? (
                                    <Button
                                        onClick={handleSaveNote}
                                        loading={savingNote}
                                        disabled={deletingNote}>
                                        Save
                                    </Button>
                                ) : (
                                    <Button
                                        variant="default"
                                        onClick={closeNoteModal}
                                        disabled={savingNote || deletingNote}>
                                        Close
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </>
    );
}
