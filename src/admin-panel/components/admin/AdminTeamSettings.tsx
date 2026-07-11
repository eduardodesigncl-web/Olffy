import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import styles from "./AdminTeamSettings.module.css";

interface AdminTeamSettingsProps {
  onNotice: (message: string) => void;
}

interface TeamMember {
  id: number;
  nombre: string;
  cargo: string;
  rut?: string;
}

const TEAM_STORAGE_KEY = "olffy-admin-team";

const SEED_TEAM: TeamMember[] = [
  { id: 1, nombre: "María José", cargo: "Vendedora" },
  { id: 2, nombre: "Equipo OLFFY", cargo: "Tienda" },
  { id: 3, nombre: "Administradora", cargo: "Admin" },
];

function loadTeam(): TeamMember[] {
  if (typeof window === "undefined") return SEED_TEAM;
  try {
    const raw = window.localStorage.getItem(TEAM_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as TeamMember[]) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_TEAM;
  } catch {
    return SEED_TEAM;
  }
}

// Equipo y responsables: lista operativa del panel, guardada en este
// dispositivo (localStorage). No es un sistema de permisos: el acceso al
// panel sigue siendo la única cuenta admin.
export function AdminTeamSettings({ onNotice }: AdminTeamSettingsProps) {
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);

  useEffect(() => {
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
  }, [team]);
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [rut, setRut] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nombre.trim() || !cargo.trim()) {
      setError("Nombre y cargo son obligatorios.");
      return;
    }
    setError(null);
    setTeam((prev) => [
      ...prev,
      {
        id: Date.now(),
        nombre: nombre.trim(),
        cargo: cargo.trim(),
        rut: rut.trim() || undefined,
      },
    ]);
    setNombre("");
    setCargo("");
    setRut("");
    onNotice("Responsable agregado a la lista de este dispositivo.");
  };

  const handleRemove = (id: number) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
    onNotice("Responsable eliminado de la lista de este dispositivo.");
  };

  return (
    <AdminSettingsSection
      title="Equipo y responsables"
      description="Lista operativa de quienes registran ventas (guardada en este dispositivo)."
    >
      <div className={styles.list}>
        {team.map((m) => (
          <div key={m.id} className={styles.member}>
            <div className={styles.info}>
              <div className={styles.name}>{m.nombre}</div>
              <div className={styles.meta}>
                {m.cargo}
                {m.rut ? ` · ${m.rut}` : ""}
              </div>
            </div>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => handleRemove(m.id)}
              aria-label={`Eliminar ${m.nombre}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <span className={styles.addTitle}>Agregar responsable</span>
        <div className={sectionStyles.fieldRow}>
          <label className={sectionStyles.field}>
            <span className={sectionStyles.label}>Nombre</span>
            <input
              className={sectionStyles.input}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <label className={sectionStyles.field}>
            <span className={sectionStyles.label}>Cargo</span>
            <input
              className={sectionStyles.input}
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej: Vendedora"
            />
          </label>
        </div>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>RUT (opcional)</span>
          <input
            className={sectionStyles.input}
            type="text"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12.345.678-9"
          />
        </label>
        {error && <span className={styles.error}>{error}</span>}
        <button type="submit" className={sectionStyles.saveBtn}>
          Agregar responsable
        </button>
      </form>
    </AdminSettingsSection>
  );
}
