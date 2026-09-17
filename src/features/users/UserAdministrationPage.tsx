import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type {
  IdentityType,
  UserAccount,
  UserCreateRequest,
  UserRole,
  UserUpdateRequest,
} from '../../api/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';

const usersQueryKey = ['admin', 'users'] as const;
const roleOptions: UserRole[] = ['USER', 'VIEWER', 'ADMIN', 'BOT'];

interface UserFormState {
  username: string;
  password: string;
  identityType: IdentityType;
  enabled: boolean;
  roles: UserRole[];
}

const emptyForm: UserFormState = {
  username: '',
  password: '',
  identityType: 'HUMAN',
  enabled: true,
  roles: ['USER'],
};

export function UserAdministrationPage() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: usersQueryKey, queryFn: api.listUsers });
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const enabledInputRef = useRef<HTMLInputElement>(null);
  const editReturnFocusRef = useRef<HTMLButtonElement | null>(null);
  const newUserButtonRef = useRef<HTMLButtonElement>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return api.updateUser(editing.id, toUpdateRequest(form));
      }
      return api.createUser(toCreateRequest(form));
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: usersQueryKey });
    },
  });

  const users = useMemo(
    () => [...(usersQuery.data ?? [])].sort((a, b) => a.username.localeCompare(b.username)),
    [usersQuery.data],
  );

  if (usersQuery.isPending) {
    return <LoadingState label="Loading application identities…" />;
  }
  if (usersQuery.error) {
    return <ErrorState error={usersQuery.error} />;
  }

  function resetForm() {
    editReturnFocusRef.current = null;
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    saveMutation.reset();
  }

  function focusUsername() {
    requestAnimationFrame(() => usernameInputRef.current?.focus());
  }

  function beginCreate() {
    resetForm();
    focusUsername();
  }

  function beginEdit(user: UserAccount, returnFocus: HTMLButtonElement) {
    editReturnFocusRef.current = returnFocus;
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      identityType: user.identityType,
      enabled: user.enabled,
      roles: [...user.roles],
    });
    setFormError(null);
    saveMutation.reset();
    requestAnimationFrame(() => enabledInputRef.current?.focus());
  }

  function cancelEdit() {
    const returnFocus = editReturnFocusRef.current;
    resetForm();
    requestAnimationFrame(() => (returnFocus ?? newUserButtonRef.current)?.focus());
  }

  function changeIdentityType(identityType: IdentityType) {
    setForm((current) => ({
      ...current,
      identityType,
      roles: normalizeBaselineRole(identityType, current.roles),
    }));
  }

  function toggleRole(role: UserRole, checked: boolean) {
    setForm((current) => ({
      ...current,
      roles: checked
        ? current.roles.includes(role)
          ? current.roles
          : [...current.roles, role]
        : current.roles.filter((candidate) => candidate !== role),
    }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!editing && !form.username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (!editing && !form.password) {
      setFormError('Password is required.');
      return;
    }

    saveMutation.mutate();
  }

  const baselineRole: UserRole = form.identityType === 'HUMAN' ? 'USER' : 'BOT';

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Security"
        title="Identity Administration"
        description="Create application identities and manage enabled state and explicit additive roles. Backend authorization and identity invariants remain authoritative."
        actions={
          <button
            className="button button--primary"
            onClick={beginCreate}
            ref={newUserButtonRef}
            type="button"
          >
            New identity
          </button>
        }
      />

      <section className="workspace-grid workspace-grid--form">
        <article className="panel table-panel">
          <div className="panel__header">
            <div>
              <h2>Application identities</h2>
              <span>{users.length} total</span>
            </div>
          </div>
          {users.length === 0 ? (
            <EmptyState>No application identities are visible.</EmptyState>
          ) : (
            <div className="table-wrap table-wrap--bounded">
              <table className="configuration-table" aria-label="Application identities">
                <thead>
                  <tr>
                    <th>Identity</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Roles</th>
                    <th>Updated</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong className="entity-name">{user.username}</strong>
                        <small className="entity-summary">{user.id}</small>
                      </td>
                      <td>{user.identityType}</td>
                      <td>
                        <span className={user.enabled ? 'status-badge status-badge--success' : 'status-badge status-badge--warning'}>
                          {user.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </td>
                      <td>{user.roles.join(' · ')}</td>
                      <td>{new Date(user.updatedAt).toLocaleString()}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="button button--ghost"
                            type="button"
                            aria-label={`Edit identity ${user.username}`}
                            onClick={(event) => beginEdit(user, event.currentTarget)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel form-panel">
          <div className="panel__header">
            <div>
              <h2>{editing ? `Edit ${editing.username}` : 'Create identity'}</h2>
              <span>
                {editing
                  ? 'Username, identity type, and password are not editable through the current backend contract.'
                  : 'Passwords are sent only in the create request and are never returned by the backend.'}
              </span>
            </div>
          </div>
          <form className="form-stack" aria-label={editing ? 'Edit application identity' : 'Create application identity'} onSubmit={submit}>
            <label>
              <span>Username</span>
              <input
                ref={usernameInputRef}
                autoComplete="off"
                disabled={Boolean(editing)}
                maxLength={200}
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>

            {!editing ? (
              <label>
                <span>Password</span>
                <input
                  autoComplete="new-password"
                  maxLength={1024}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
            ) : null}

            <label>
              <span>Identity type</span>
              <select
                disabled={Boolean(editing)}
                value={form.identityType}
                onChange={(event) => changeIdentityType(event.target.value as IdentityType)}
              >
                <option value="HUMAN">HUMAN</option>
                <option value="BOT">BOT</option>
              </select>
            </label>

            <label className="checkbox-row">
              <input
                ref={enabledInputRef}
                checked={form.enabled}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              />
              <span>Enabled</span>
            </label>

            <fieldset className="role-fieldset">
              <legend>Explicit roles</legend>
              <p className="form-help">
                Roles are additive and non-hierarchical. The backend always includes {baselineRole} for {form.identityType} identities.
              </p>
              <div className="role-grid">
                {roleOptions.map((role) => {
                  const baseline = role === baselineRole;
                  return (
                    <label className="checkbox-row" key={role}>
                      <input
                        checked={baseline || form.roles.includes(role)}
                        disabled={baseline}
                        type="checkbox"
                        onChange={(event) => toggleRole(role, event.target.checked)}
                      />
                      <span>{role}{baseline ? ' (required)' : ''}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {formError ? <div className="inline-error" role="alert">{formError}</div> : null}
            {saveMutation.error ? <ErrorState error={saveMutation.error} /> : null}

            <div className="form-actions">
              <button className="button button--primary" disabled={saveMutation.isPending} type="submit">
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create identity'}
              </button>
              {editing ? (
                <button className="button button--ghost" onClick={cancelEdit} type="button">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}

function normalizeBaselineRole(identityType: IdentityType, roles: UserRole[]): UserRole[] {
  const baseline: UserRole = identityType === 'HUMAN' ? 'USER' : 'BOT';
  return roles.includes(baseline) ? roles : [...roles, baseline];
}

function normalizedRoles(form: UserFormState): UserRole[] {
  return normalizeBaselineRole(form.identityType, form.roles);
}

function toCreateRequest(form: UserFormState): UserCreateRequest {
  return {
    username: form.username.trim(),
    password: form.password,
    identityType: form.identityType,
    enabled: form.enabled,
    roles: normalizedRoles(form),
  };
}

function toUpdateRequest(form: UserFormState): UserUpdateRequest {
  return {
    enabled: form.enabled,
    roles: normalizedRoles(form),
  };
}
