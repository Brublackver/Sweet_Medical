'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import NuevoMedicoTab       from '@/components/admin/tabs/NuevoMedicoTab';
import GestionarMedicoTab   from '@/components/admin/tabs/GestionarMedicoTab';
import NuevoPacienteTab     from '@/components/admin/tabs/NuevoPacienteTab';
import GestionarPacienteTab from '@/components/admin/tabs/GestionarPacienteTab';
import ObrasSocialesTab     from '@/components/admin/tabs/ObrasSocialesTab';
import PersonalTab          from '@/components/admin/tabs/PersonalTab';
import styles from './AdminPage.module.css';

const TABS = [
  { id: 'nuevo-medico',      label: '➕ Nuevo Médico' },
  { id: 'gestionar-medico',  label: '👨‍⚕️ Gestionar Médico' },
  { id: 'nuevo-paciente',    label: '➕ Nuevo Paciente' },
  { id: 'gestionar-paciente', label: '👤 Gestionar Paciente' },
  { id: 'obras-sociales',    label: '🏥 Obras Sociales' },
  { id: 'personal',          label: '🧹 Personal' },
];

export default function AdminPage() {
  const { admin, cargado, logout } = useAdmin();
  const router = useRouter();
  const [seccion, setSeccion] = useState('nuevo-medico');

  useEffect(() => {
    if (cargado && !admin) router.replace('/login');
  }, [admin, cargado, router]);

  if (!cargado || !admin) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.headerLogo}>🏥 Sweet Medical</span>
          <div className={styles.headerRight}>
            <span className={styles.adminTag}>🔐 Administrador</span>
            <button onClick={() => { logout(); router.push('/login'); }} className={styles.logoutBtn}>Salir</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1 className={styles.titulo}>Panel de Administración</h1>
            <p className={styles.subtitulo}>Creá y gestioná médicos y pacientes del sistema</p>
          </div>

          <div className={styles.tabs} role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={seccion === t.id}
                onClick={() => setSeccion(t.id)}
                className={`${styles.tab} ${seccion === t.id ? styles.tabActive : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.card}>
            {seccion === 'nuevo-medico'      && <NuevoMedicoTab />}
            {seccion === 'gestionar-medico'  && <GestionarMedicoTab />}
            {seccion === 'nuevo-paciente'    && <NuevoPacienteTab />}
            {seccion === 'gestionar-paciente' && <GestionarPacienteTab />}
            {seccion === 'obras-sociales'    && <ObrasSocialesTab />}
            {seccion === 'personal'          && <PersonalTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
