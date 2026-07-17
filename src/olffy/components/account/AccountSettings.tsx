import { useState, type FormEvent } from 'react';
import styles from './AccountSettings.module.css';

export type AccountSettingsResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

interface AccountSettingsProps {
  nombre: string;
  email: string;
  telefono: string;
  estado: 'activa' | 'bloqueada';
  creadaEl: string;
  saldo: number;
  nextReward: string;
  ruleEarning: string;
  ruleValidity: string;
  onGoToReglas: () => void;
  onUpdateProfile: (input: {
    fullName: string;
    phone: string;
  }) => Promise<AccountSettingsResult>;
  onChangePassword: (input: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<AccountSettingsResult>;
}

type CommPref = 'novedades' | 'recordatorios' | 'pedidos';

// Pestaña Configuración del perfil cliente, conectada al backend real:
// los datos de cuenta y el cambio de contraseña llaman a las acciones de la
// integración (Supabase); el correo es el identificador de la cuenta y no se
// cambia desde aquí.
export function AccountSettings({
  nombre,
  email,
  telefono,
  estado,
  creadaEl,
  saldo,
  nextReward,
  ruleEarning,
  ruleValidity,
  onGoToReglas,
  onUpdateProfile,
  onChangePassword,
}: AccountSettingsProps) {
  // ── Datos de cuenta ──
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(nombre);
  const [phone, setPhone] = useState(telefono);
  const [draftName, setDraftName] = useState(nombre);
  const [draftPhone, setDraftPhone] = useState(telefono);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const startEdit = () => {
    setDraftName(name);
    setDraftPhone(phone);
    setSavedMsg(false);
    setProfileError(null);
    setEditing(true);
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    try {
      const result = await onUpdateProfile({
        fullName: draftName.trim(),
        phone: draftPhone.trim(),
      });
      if (!result.ok) {
        setProfileError(result.error);
        return;
      }
      setName(draftName.trim() || name);
      setPhone(draftPhone.trim());
      setEditing(false);
      setSavedMsg(true);
    } catch {
      setProfileError('No se pudieron guardar los cambios.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Cambiar contraseña ──
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passOk, setPassOk] = useState(false);
  const [passSaving, setPassSaving] = useState(false);

  const submitPass = async (e: FormEvent) => {
    e.preventDefault();
    setPassOk(false);
    if (curPass === '') {
      setPassError('Ingresa tu contraseña actual.');
      return;
    }
    if (newPass.length < 8) {
      setPassError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    setPassError(null);
    setPassSaving(true);
    try {
      const result = await onChangePassword({
        currentPassword: curPass,
        password: newPass,
        passwordConfirmation: confirmPass,
      });
      if (!result.ok) {
        setPassError(result.error);
        return;
      }
      setPassOk(true);
      setCurPass('');
      setNewPass('');
      setConfirmPass('');
    } catch {
      setPassError('No se pudo actualizar la contraseña. Intenta nuevamente.');
    } finally {
      setPassSaving(false);
    }
  };

  // ── Preferencias de comunicación (locales, aún sin backend) ──
  const [prefs, setPrefs] = useState<Record<CommPref, boolean>>({
    novedades: true,
    recordatorios: true,
    pedidos: true,
  });

  const togglePref = (key: CommPref) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const PREF_LABELS: { key: CommPref; label: string }[] = [
    { key: 'novedades', label: 'Recibir novedades y lanzamientos por correo' },
    { key: 'recordatorios', label: 'Recibir recordatorios de puntos y recompensas' },
    { key: 'pedidos', label: 'Recibir información de pedidos' },
  ];

  return (
    <div className={styles.wrap}>
      {/* Fila superior: datos de cuenta + preferencias */}
      <div className={styles.row}>
        {/* ── Datos de cuenta ── */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Datos de cuenta</h3>
            {!editing && (
              <button type="button" className={styles.editBtn} onClick={startEdit}>
                Editar datos
              </button>
            )}
          </div>

          {editing ? (
            <form className={styles.form} onSubmit={(event) => void saveEdit(event)} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="set-name">Nombre</label>
                <input id="set-name" className={styles.input} type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} autoComplete="name" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="set-phone">Teléfono</label>
                <input id="set-phone" className={styles.input} type="tel" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} placeholder="+56 9 1234 5678" autoComplete="tel" />
              </div>
              {profileError && <p className={styles.error} role="alert">{profileError}</p>}
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryBtn} disabled={profileSaving}>
                  {profileSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button type="button" className={styles.ghostBtn} onClick={() => setEditing(false)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <dl className={styles.dataList}>
                <div className={styles.dataRow}>
                  <dt className={styles.dataLabel}>Nombre</dt>
                  <dd className={styles.dataValue}>{name}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt className={styles.dataLabel}>Correo</dt>
                  <dd className={styles.dataValue}>{email}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt className={styles.dataLabel}>Teléfono</dt>
                  <dd className={styles.dataValue}>{phone || 'Sin registrar'}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt className={styles.dataLabel}>Estado de cuenta</dt>
                  <dd className={styles.dataValue}>
                    <span className={styles.statusBadge}>
                      {estado === 'activa' ? 'Activa' : 'Bloqueada'}
                    </span>
                  </dd>
                </div>
                <div className={styles.dataRow}>
                  <dt className={styles.dataLabel}>Cuenta creada</dt>
                  <dd className={styles.dataValue}>{creadaEl}</dd>
                </div>
              </dl>
              {savedMsg && <p className={styles.success} role="status">Datos actualizados.</p>}
            </>
          )}
        </section>

        {/* ── Preferencias de comunicación ── */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Preferencias de comunicación</h3>
          </div>
          <ul className={styles.prefList}>
            {PREF_LABELS.map((pref) => (
              <li key={pref.key} className={styles.prefItem}>
                <label className={styles.switchLabel}>
                  <span className={styles.prefText}>{pref.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[pref.key]}
                    className={`${styles.switch} ${prefs[pref.key] ? styles.switchOn : ''}`}
                    onClick={() => togglePref(pref.key)}
                  >
                    <span className={styles.switchState}>{prefs[pref.key] ? 'Sí' : 'No'}</span>
                    <span className={styles.knob} aria-hidden="true" />
                  </button>
                </label>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>
            Estas preferencias aplican a este dispositivo. Para dejar de recibir
            correos, usa el enlace al pie de cualquier correo OLFFY.
          </p>
        </section>
      </div>

      {/* Fila media: correo (informativo) + cambiar contraseña */}
      <div className={styles.row}>
        {/* ── Correo de la cuenta ── */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Correo de la cuenta</h3>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cur-email">Correo actual</label>
            <input id="cur-email" className={styles.inputReadonly} type="email" value={email} readOnly />
          </div>
          <p className={styles.hint}>
            Tu correo identifica tu cuenta OLFFY Puntos y las compras que
            acumulan puntos. Si necesitas cambiarlo, escríbenos por la página de
            contacto y lo gestionamos contigo.
          </p>
        </section>

        {/* ── Cambiar contraseña ── */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>Cambiar contraseña</h3>
          </div>
          <form className={styles.form} onSubmit={(event) => void submitPass(event)} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cur-pass">Contraseña actual</label>
              <input id="cur-pass" className={styles.input} type="password" value={curPass} onChange={(e) => { setCurPass(e.target.value); setPassError(null); setPassOk(false); }} autoComplete="current-password" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-pass">Nueva contraseña</label>
              <input id="new-pass" className={styles.input} type="password" value={newPass} onChange={(e) => { setNewPass(e.target.value); setPassError(null); setPassOk(false); }} autoComplete="new-password" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-pass">Confirmar nueva contraseña</label>
              <input id="confirm-pass" className={styles.input} type="password" value={confirmPass} onChange={(e) => { setConfirmPass(e.target.value); setPassError(null); setPassOk(false); }} autoComplete="new-password" />
            </div>
            {passError && <p className={styles.error} role="alert">{passError}</p>}
            {passOk && <p className={styles.success} role="status">Contraseña actualizada correctamente.</p>}
            <button type="submit" className={styles.primaryBtn} disabled={passSaving}>
              {passSaving ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
      </div>

      {/* ── Información de OLFFY Puntos (ancho completo) ── */}
      <section className={`${styles.card} ${styles.infoCard}`}>
        <div className={styles.cardHead}>
          <h3 className={styles.cardTitle}>Información de OLFFY Puntos</h3>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Saldo actual</span>
            <span className={styles.infoValue}>{saldo.toLocaleString('es-CL')} pts</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Próxima recompensa</span>
            <span className={styles.infoValue}>{nextReward}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Cómo se calculan</span>
            <span className={styles.infoText}>{ruleEarning}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Vigencia</span>
            <span className={styles.infoText}>{ruleValidity}</span>
          </div>
        </div>
        <button type="button" className={styles.linkBtn} onClick={onGoToReglas}>
          Ver reglas del programa
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </section>
    </div>
  );
}
