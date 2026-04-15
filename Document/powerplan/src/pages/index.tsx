import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          PowerPlan Dokumentáció
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/bevezetés">
            Dokumentáció megnyitása
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="PowerPlan Dokumentáció"
      description="A PowerPlan projektmunka dokumentációja, rendszertervvel és funkcióleírással.">
      <HomepageHeader />
      <main className={styles.mainContent}>
        <section className={styles.overviewSection}>
          <div className="container">
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <h2>Mi található itt?</h2>
                <p>
                  Teljes dokumentáció a PowerPlan projektmunkához: architektúra,
                  adatbázis-tervezés, telepítés, és részletes funkcióleírások.
                </p>
                <ul>
                  <li>Áttekintő rendszerterv</li>
                  <li>Funkciók részekre bontva</li>
                  <li>Telepítési útmutató Dockerrel</li>
                </ul>
              </div>
              <div className={styles.overviewCard}>
                <h2>Főbb részek</h2>
                <ul>
                  <li>Bejelentkezés és felhasználói profil</li>
                  <li>Kérdőív és személyre szabott ajánlások</li>
                  <li>Dashboard és előrehaladás követés</li>
                  <li>Étrend és edzéskezelés</li>
                </ul>
              </div>
              <div className={styles.overviewCard}>
                <h2>Hogyan használd?</h2>
                <p>
                  A bal oldali dokumentációs sávon tallózhatsz a fő témakörök
                  között. A kezdőoldalon a legfontosabb információk gyorsan
                  áttekinthetők.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
