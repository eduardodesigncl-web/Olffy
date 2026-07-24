import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import styles from "./AdminTeamSettings.module.css";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  type AdminPermission as Permission,
  type AdminRole as Role,
} from "lib/admin/permissions";
import { PasswordInput } from "src/shared/PasswordInput";

interface TeamMember {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: Role;
  permissions: Permission[];
  status: "active" | "disabled";
}

const PERMISSION_LABEL: Record<Permission, string> = {
  dashboard: "Dashboard",
  ventas: "Ventas",
  pos: "Tienda POS",
  clientes: "Clientes",
  puntos: "Puntos",
  recompensas: "Recompensas",
  productos: "Productos",
  colecciones: "Colecciones",
  ajustes: "Ajustes",
};

const PERMISSIONS = ADMIN_PERMISSIONS.map((id) => ({
  id,
  label: PERMISSION_LABEL[id],
}));

const ROLE_LABEL: Record<Role, string> = {
  owner: "Propietaria",
  manager: "Encargada",
  cashier: "Caja",
  custom: "Personalizado",
};

export function AdminTeamSettings({
  onNotice,
}: {
  onNotice: (message: string) => void;
}) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("cashier");
  const [permissions, setPermissions] = useState<Permission[]>(
    ADMIN_ROLE_PERMISSIONS.cashier,
  );
  const [status, setStatus] = useState<"active" | "disabled">("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Solo el propietario puede eliminar cuentas; el borrado es definitivo y
  // pide una confirmación inline por cuenta.
  const [viewerIsOwner, setViewerIsOwner] = useState(false);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/accounts", {
        credentials: "include",
      });
      const data = (await response.json()) as {
        error?: string;
        accounts?: TeamMember[];
        viewerIsOwner?: boolean;
        viewerUserId?: string | null;
      };
      if (!response.ok)
        throw new Error(data.error || "No se pudo cargar el equipo");
      setTeam(data.accounts ?? []);
      setViewerIsOwner(Boolean(data.viewerIsOwner));
      setViewerUserId(data.viewerUserId ?? null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo cargar el equipo",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeam();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("cashier");
    setPermissions(ADMIN_ROLE_PERMISSIONS.cashier);
    setStatus("active");
    setError(null);
  };

  const selectRole = (next: Role) => {
    setRole(next);
    if (next !== "custom") setPermissions(ADMIN_ROLE_PERMISSIONS[next]);
  };

  const removeMember = async (member: TeamMember) => {
    setDeletingId(member.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: member.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "No se pudo eliminar la cuenta");
      }
      setTeam((current) => current.filter((item) => item.id !== member.id));
      if (editing?.id === member.id) resetForm();
      setConfirmId(null);
      onNotice("Cuenta eliminada definitivamente.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar la cuenta",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (member: TeamMember) => {
    setEditing(member);
    setFullName(member.full_name);
    setEmail(member.email);
    setPassword("");
    setRole(member.role);
    setPermissions(member.permissions);
    setStatus(member.status);
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/accounts", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editing?.id,
          fullName,
          email,
          password,
          role,
          permissions,
          status,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        account?: TeamMember;
      };
      if (!response.ok || !data.account) {
        throw new Error(data.error || "No se pudo guardar la cuenta");
      }
      setTeam((current) =>
        editing
          ? current.map((item) =>
              item.id === data.account!.id ? data.account! : item,
            )
          : [...current, data.account!],
      );
      onNotice(
        editing
          ? "Permisos de la cuenta actualizados."
          : "Cuenta administrativa creada.",
      );
      resetForm();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo guardar la cuenta",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSettingsSection
      title="Equipo, roles y permisos"
      description="Cuentas con contraseña propia y acceso limitado por pestañas."
    >
      <div className={styles.list}>
        {loading ? <p className={styles.empty}>Cargando cuentas…</p> : null}
        {!loading && team.length === 0 ? (
          <p className={styles.empty}>
            Aún no hay cuentas de equipo. El acceso principal sigue disponible.
          </p>
        ) : null}
        {team.map((member) => (
          <div key={member.id} className={styles.member}>
            <div className={styles.info}>
              <div className={styles.name}>{member.full_name}</div>
              <div className={styles.meta}>
                {member.email} · {ROLE_LABEL[member.role]} ·{" "}
                {member.status === "active" ? "Activa" : "Deshabilitada"}
              </div>
              <div className={styles.tags}>
                {member.permissions.map((permission) => (
                  <span key={permission}>
                    {PERMISSIONS.find((item) => item.id === permission)
                      ?.label ?? permission}
                  </span>
                ))}
              </div>
            </div>
            {confirmId === member.id ? (
              <div className={styles.confirmBox}>
                <span className={styles.confirmText}>
                  ¿Eliminar definitivamente?
                </span>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={() => void removeMember(member)}
                  disabled={deletingId === member.id}
                >
                  {deletingId === member.id ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setConfirmId(null)}
                  disabled={deletingId === member.id}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className={styles.memberActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => startEditing(member)}
                >
                  Editar permisos
                </button>
                {viewerIsOwner && member.auth_user_id !== viewerUserId ? (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => setConfirmId(member.id)}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <form className={styles.addForm} onSubmit={submit}>
        <span className={styles.addTitle}>
          {editing
            ? `Editar ${editing.full_name}`
            : "Crear cuenta administrativa"}
        </span>
        <div className={sectionStyles.fieldRow}>
          <label className={sectionStyles.field}>
            <span className={sectionStyles.label}>Nombre</span>
            <input
              className={sectionStyles.input}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label className={sectionStyles.field}>
            <span className={sectionStyles.label}>Email</span>
            <input
              className={sectionStyles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={Boolean(editing)}
              required
            />
          </label>
        </div>
        <div className={sectionStyles.fieldRow}>
          <div className={sectionStyles.field}>
            <label
              className={sectionStyles.label}
              htmlFor="admin-team-password"
            >
              Contraseña {editing ? "(vacía para conservarla)" : ""}
            </label>
            <PasswordInput
              id="admin-team-password"
              className={sectionStyles.input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required={!editing}
            />
          </div>
          <label className={sectionStyles.field}>
            <span className={sectionStyles.label}>Rol</span>
            <select
              className={sectionStyles.select}
              value={role}
              onChange={(event) => selectRole(event.target.value as Role)}
            >
              {Object.entries(ROLE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className={styles.permissions}>
          <legend>Permisos por pestaña</legend>
          {PERMISSIONS.map((permission) => (
            <label key={permission.id}>
              <input
                type="checkbox"
                checked={permissions.includes(permission.id)}
                disabled={role !== "custom"}
                onChange={(event) =>
                  setPermissions((current) =>
                    event.target.checked
                      ? [...current, permission.id]
                      : current.filter((item) => item !== permission.id),
                  )
                }
              />
              {permission.label}
            </label>
          ))}
        </fieldset>
        {editing ? (
          <label className={sectionStyles.field}>
            <span className={sectionStyles.label}>Estado de la cuenta</span>
            <select
              className={sectionStyles.select}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "active" | "disabled")
              }
            >
              <option value="active">Activa</option>
              <option value="disabled">Deshabilitada</option>
            </select>
          </label>
        ) : null}
        {error ? <span className={styles.error}>{error}</span> : null}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={sectionStyles.saveBtn}
            disabled={saving}
          >
            {saving
              ? "Guardando…"
              : editing
                ? "Guardar permisos"
                : "Crear cuenta"}
          </button>
          {editing ? (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={resetForm}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </AdminSettingsSection>
  );
}
