import styles from '@/features/login/Login.module.css';

/*
  AuthSidePanel — panel lateral de marca compartido por Login y Registro.
  Solo cambian el subtítulo y la lista de features según la pantalla.
*/
export default function AuthSidePanel({ subtitle, features }) {
  return (
    <div className={styles.leftPanel}>
      <div className={styles.leftBg} />
      <div className={styles.leftTop}>
        <div className={styles.leftLogo} aria-hidden="true">🏥</div>
        <h1 className={styles.leftTitle}>Sweet Medical</h1>
        <p className={styles.leftSubtitle}>{subtitle}</p>
      </div>

      <div className={styles.features}>
        {features.map(({ icon, titulo, desc }) => (
          <div key={titulo} className={styles.feature}>
            <span className={styles.featureIcon} aria-hidden="true">{icon}</span>
            <div>
              <p className={styles.featureTitle}>{titulo}</p>
              <p className={styles.featureDesc}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className={styles.leftFooter}>© 2026 Sweet Medical</p>
    </div>
  );
}
