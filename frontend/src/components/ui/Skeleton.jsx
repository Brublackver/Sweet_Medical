import styles from './Skeleton.module.css';

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div className={`${styles.bar} ${styles.barShort}`} />
        <div className={`${styles.bar} ${styles.barRound}`} />
      </div>
      <div className={`${styles.bar} ${styles.barMedium}`} />
      <div className={`${styles.bar} ${styles.barLong}`} />
      <div className={`${styles.bar} ${styles.barFull}`} />
      <div className={styles.footer}>
        <div className={styles.priceSkeleton} />
        <div className={styles.btnSkeleton} />
      </div>
    </div>
  );
}

export function SkeletonDia() {
  return (
    <div className={styles.dia}>
      <div className={styles.diaTitle} />
      <div className={styles.diaGrid}>
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
