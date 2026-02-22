"use client";

import { isAxiosError } from "axios";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Group,
    Modal,
    Skeleton,
    Stack,
    Text,
    Textarea,
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

interface ClientNotesSectionProps {
    clientId: string;
}

function getNotePreview(body: string, maxLength = 160): string {
    const normalized = body.replace(/\s+/g, " ").trim();

    if (!normalized) {
        return "Empty note";
    }

    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export default function ClientNotesSection({ clientId }: ClientNotesSectionProps) {
    const api = useApi();

    const [notes, setNotes] = useState<Note[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [notesActionError, setNotesActionError] = useState<string | null>(null);
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
        if (!selectedNote) {
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
        if (!selectedNote) {
            return;
        }

        const confirmed = window.confirm("Delete this note? This action cannot be undone.");
        if (!confirmed) {
            return;
        }

        setDeletingNote(true);
        setNoteModalError(null);

        try {
            await api.clients.deleteNote(clientId, selectedNote.id);
            setNotes(currentNotes =>
                currentNotes.filter(note => note.id !== selectedNote.id)
            );
            closeNoteModal();
            await refreshNotes();
        } catch (error) {
            setNoteModalError(
                getRequestErrorMessage(
                    error,
                    "Unable to delete note right now. Please try again."
                )
            );
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
                        <Stack gap="sm">
                            {notes.map(note => {
                                const timestampSource =
                                    note.updated_at !== note.created_at
                                        ? note.updated_at
                                        : note.created_at;
                                const timestampLabel =
                                    note.updated_at !== note.created_at
                                        ? `Edited ${formatRelativeDate(timestampSource)}`
                                        : formatRelativeDate(timestampSource);

                                return (
                                    <UnstyledButton
                                        key={note.id}
                                        className={styles.noteCardButton}
                                        onClick={() => openNoteModal(note)}
                                    >
                                        <Card
                                            withBorder
                                            radius="md"
                                            padding="md"
                                            className={styles.noteCard}>
                                            <Stack gap="xs">
                                                <Group
                                                    justify="space-between"
                                                    align="flex-start"
                                                    wrap="wrap">
                                                    <Text fw={500}>{getNoteAuthorLabel(note)}</Text>
                                                    <Tooltip
                                                        label={formatExactDate(timestampSource)}
                                                        withArrow>
                                                        <Text
                                                            size="xs"
                                                            c="dimmed">
                                                            {timestampLabel}
                                                        </Text>
                                                    </Tooltip>
                                                </Group>
                                                <Text
                                                    size="sm"
                                                    c={note.body.trim() ? undefined : "dimmed"}
                                                    className={styles.notePreview}>
                                                    {getNotePreview(note.body)}
                                                </Text>
                                            </Stack>
                                        </Card>
                                    </UnstyledButton>
                                );
                            })}
                        </Stack>
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
                            align="flex-start"
                            wrap="wrap">
                            <div>
                                <Text fw={500}>{getNoteAuthorLabel(selectedNote)}</Text>
                                <Tooltip
                                    label={formatExactDate(selectedNote.updated_at)}
                                    withArrow>
                                    <Text
                                        size="sm"
                                        c="dimmed">
                                        {selectedNote.updated_at !== selectedNote.created_at
                                            ? `Edited ${formatRelativeDate(selectedNote.updated_at)}`
                                            : formatRelativeDate(selectedNote.created_at)}
                                    </Text>
                                </Tooltip>
                            </div>
                            {isSelectedNoteAuthor && noteModalMode === "view" && (
                                <Button
                                    variant="light"
                                    size="xs"
                                    onClick={() => {
                                        setNoteDraftBody(selectedNote.body);
                                        setNoteModalError(null);
                                        setNoteModalMode("edit");
                                    }}>
                                    Edit
                                </Button>
                            )}
                        </Group>

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
                            <Group>
                                {isSelectedNoteAuthor && (
                                    <Button
                                        color="red"
                                        variant="light"
                                        onClick={handleDeleteNote}
                                        loading={deletingNote}
                                        disabled={savingNote}>
                                        Delete
                                    </Button>
                                )}
                            </Group>
                            <Group>
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
