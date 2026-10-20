"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import TextField from "@/components/forms/TextField";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import type { FieldErrors } from "@/lib/api/errors";
import { workspaceApi } from "@/lib/api/workspace";
import { describeFailure, validateForm } from "@/lib/forms";
import { initialsOf } from "@/lib/people";
import { createInviteRequestSchema, type Member, type PendingInvite } from "@/lib/schemas/workspace";
import type { AvatarTone } from "@/types";
import SettingsSection from "../SettingsSection";
import { BILLING_PATH } from "@/lib/app-paths";


interface MembersPanelProps {
  isOwner: boolean;
  currentUserId: string;
  members: Member[];
  /** Pending invites; always empty for members, who can't see them. */
  invites: PendingInvite[];
  /** Members plus pending invites the effective plan allows; `null` is unlimited. */
  memberLimit: number | null;
}

/** Settings → Members: the member list for everyone; inviting, revoking and removing for owners. */
export default function MembersPanel({ isOwner, currentUserId, members: initialMembers, invites: initialInvites, memberLimit }: MembersPanelProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [lastInvite, setLastInvite] = useState<PendingInvite | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const atLimit = memberLimit !== null && members.length + invites.length >= memberLimit;
  const upgradeMessage =
    limitMessage ??
    (atLimit ? `You've reached your plan's limit of ${memberLimit} members, including pending invites.` : null);

  return (
    <div className="grid gap-6">
      {isOwner && (
        <SettingsSection title="Invite teammates" description="We don't send emails in this demo. Share the invite link yourself; it works once, for 7 days.">
          {upgradeMessage ? (
            <UpgradePrompt message={upgradeMessage} />
          ) : (
            <InviteForm
              onInvited={(invite) => {
                setInvites((current) => [invite, ...current]);
                setLastInvite(invite);
              }}
              onLimitReached={setLimitMessage}
            />
          )}
          {lastInvite && <InviteLink invite={lastInvite} />}
        </SettingsSection>
      )}

      {isOwner && invites.length > 0 && (
        <SettingsSection title="Pending invites">
          <ul aria-label="Pending invites" className="divide-y divide-line">
            {invites.map((invite) => (
              <PendingInviteRow
                key={invite.id}
                invite={invite}
                onRevoked={() => {
                  setInvites((current) => current.filter((i) => i.id !== invite.id));
                  setLimitMessage(null);
                  if (lastInvite?.id === invite.id) setLastInvite(null);
                }}
              />
            ))}
          </ul>
        </SettingsSection>
      )}

      <SettingsSection
        title="Members"
        description={
          isOwner
            ? `${members.length} ${members.length === 1 ? "person has" : "people have"} access${memberLimit === null ? "." : ` (up to ${memberLimit} with invites on your plan).`}`
            : "Only the workspace owner can invite or remove people."
        }
      >
        <ul aria-label="Members" className="divide-y divide-line">
          {members.map((member, index) => (
            <MemberRow
              key={member.id}
              member={member}
              tone={(index % 5) as AvatarTone}
              isYou={member.id === currentUserId}
              canRemove={isOwner && member.role !== "owner"}
              onRemoved={() => {
                setMembers((current) => current.filter((m) => m.id !== member.id));
                setLimitMessage(null);
              }}
            />
          ))}
        </ul>
      </SettingsSection>
    </div>
  );
}

function UpgradePrompt({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-brand/25 bg-tint p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-sm text-ink">
          {message} <span className="text-muted-foreground">Pro and Business have unlimited members.</span>
        </p>
      </div>
      <Button asChild className="shrink-0">
        <Link href={BILLING_PATH}>Upgrade plan</Link>
      </Button>
    </div>
  );
}

function InviteForm({
  onInvited,
  onLimitReached,
}: {
  onInvited: (invite: PendingInvite) => void;
  onLimitReached: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const result = validateForm(createInviteRequestSchema, { email });
    if (!result.ok) return setFieldErrors(result.fieldErrors);

    setSubmitting(true);
    try {
      const { invite } = await workspaceApi.createInvite(result.data);
      setEmail("");
      onInvited(invite);
      toast.success(`Invite created for ${invite.email}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PLAN_LIMIT_REACHED") return onLimitReached(error.message);
      const failure = describeFailure(error);
      setFieldErrors(failure.fieldErrors);
      if (failure.message) toast.error(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-start">
      <TextField
        label="Email address"
        type="email"
        autoComplete="off"
        placeholder="teammate@company.com"
        className="flex-1"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setFieldErrors({});
        }}
        errors={fieldErrors.email}
      />
      <Button type="submit" className="h-11 rounded-xl sm:mt-[1.625rem]" disabled={submitting}>
        {submitting ? "Inviting…" : "Send invite"}
      </Button>
    </form>
  );
}

const absoluteUrl = (path: string) => `${window.location.origin}${path}`;

function useCopy() {
  const [copied, setCopied] = useState(false);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }
  return { copied, copy };
}

function InviteLink({ invite }: { invite: PendingInvite }) {
  const url = absoluteUrl(invite.inviteUrl);
  const { copied, copy } = useCopy();
  return (
    <div className="mt-5 grid gap-1.5 rounded-xl border border-line bg-bg p-4">
      <label htmlFor="invite-link" className="text-sm font-semibold text-ink">
        Invite link
      </label>
      <p className="text-sm text-muted-foreground">Send this to {invite.email}. Anyone with the link can join as that email.</p>
      <div className="mt-1 flex gap-2">
        <input
          id="invite-link"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 font-mono text-xs text-ink"
        />
        <Button type="button" variant="outline" className="h-10" onClick={() => copy(url)}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}

function PendingInviteRow({ invite, onRevoked }: { invite: PendingInvite; onRevoked: () => void }) {
  const { copied, copy } = useCopy();
  const [busy, setBusy] = useState(false);

  async function revoke() {
    setBusy(true);
    try {
      await workspaceApi.revokeInvite(invite.id);
      onRevoked();
      toast.success(`Invite for ${invite.email} revoked`);
    } catch (error) {
      toast.error(describeFailure(error).message ?? "Couldn't revoke the invite.");
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{invite.email}</p>
        <p className="text-xs text-muted-foreground">
          Expires {new Date(invite.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => copy(absoluteUrl(invite.inviteUrl))} aria-label={`Copy invite link for ${invite.email}`}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={revoke} aria-label={`Revoke invite for ${invite.email}`}>
          Revoke
        </Button>
      </div>
    </li>
  );
}

function MemberRow({
  member,
  tone,
  isYou,
  canRemove,
  onRemoved,
}: {
  member: Member;
  tone: AvatarTone;
  isYou: boolean;
  canRemove: boolean;
  onRemoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await workspaceApi.removeMember(member.id);
      setOpen(false);
      onRemoved();
      toast.success(`${member.name} was removed`);
    } catch (error) {
      toast.error(describeFailure(error).message ?? "Couldn't remove this member.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar initials={initialsOf(member.name)} tone={tone} size="lg" className="ring-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {member.name}
            {isYou && <span className="font-normal text-muted-foreground"> (you)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold text-muted-foreground capitalize">{member.role}</span>
        {canRemove && (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`Remove ${member.name}`}>
              Remove
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove {member.name}?</DialogTitle>
                <DialogDescription>
                  They lose access to this workspace right away. Tasks assigned to them become unassigned; their comments stay.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" disabled={busy} onClick={remove}>
                  {busy ? "Removing…" : "Remove member"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </li>
  );
}
