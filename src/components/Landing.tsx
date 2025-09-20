import React from 'react';

interface MenuItem { name: string; price: number; desc?: string; ing?: string }

const ESSEN: MenuItem[] = [
  { name: 'Baumkuchen', price: 18, desc: 'Traditionell – süß & luftig', ing: 'Eier · Mehl · Zucker' },
  { name: 'Cheeseburger', price: 22, desc: 'Saftiges Rind + Käse', ing: 'Rind · Käse · Brötchen' },
  { name: 'Baguette', price: 20, desc: 'Frisch gebacken', ing: 'Weizen · Hefe · Salz' },
  { name: 'Chicken Wings', price: 25, desc: 'Knusprig gewürzt', ing: 'Huhn · leichte Marinade · Knoblauch' },
  { name: 'Cookie', price: 15, desc: 'Hausgemacht', ing: 'Mehl · Schokolade · Butter' },
  { name: 'Eis', price: 17, desc: 'Cremige Sorten', ing: 'Milch · Vanille · etwas Zucker' },
  { name: 'Frischer Salat', price: 21, desc: 'Leicht & frisch', ing: 'Blattsalat · Gurke · Tomate' },
  { name: 'Rahmschnitzel nach Wirtshausart', price: 32, desc: 'Mit cremiger Sauce', ing: 'Schwein · Rahm · Zwiebeln' },
  { name: 'Rindsroulade mit Soße & Rotkohl', price: 38, desc: 'Deftige Hausmannskost', ing: 'Rind · Rotkohl · Bratensoße' }
];

const TRINKEN: MenuItem[] = [
  { name: 'Gin', price: 28, ing: 'Wacholder · feine Botanicals' },
  { name: 'Cola', price: 18, ing: 'Erfrischend · koffeinhaltig' },
  { name: 'Wasser', price: 15, ing: 'Still / leicht mineralisch' },
  { name: 'Jägermeister', price: 30, ing: 'Kräuter-Auszug' },
  { name: 'Bier', price: 25, ing: 'Gerste · Hopfen · Hefe' },
  { name: 'Fanta', price: 18, ing: 'Orangen-Note' },
  { name: 'Kaffee', price: 20, ing: 'Frisch gemahlene Bohnen' },
  { name: 'Eistee', price: 19, ing: 'Schwarztee · Zitrus' },
  { name: 'Vodka', price: 32, ing: 'Klar destilliert' },
  { name: 'Whiskey', price: 40, ing: 'Gerstenmalz · gereift' },
  { name: 'Champagner', price: 300, ing: 'Perlend · edel · festlich' },
  { name: 'Hennessy', price: 50, ing: 'Cognac · reichhaltig · aromatisch' },
  { name: 'Tequila', price: 40, ing: 'Agave · kräftig · mexikanisch' },
  { name: 'Sex on the Beach Cocktail', price: 40, ing: 'Fruchtig · Pfirsich · Cranberry' },
  { name: 'Aperol Spritz', price: 35, ing: 'Spritzig · Orange · Bitter' },
  { name: 'Sprunk', price: 20, ing: 'Spritzig · süß · kultig' }
];

export function Landing() {
  return (
    <div className="ff-root">
      <div className="ff-wood-bg" />
      <div className="ff-overlay">
        <header className="ff-header">
          <div className="ff-brand">
            <img src="/logo.svg" alt="Fusion Feast" className="ff-logo" />
            <div>
              <h1>Fusion Feast</h1>
              <p className="ff-tagline">Kulinarische Vielfalt – frisch, regional, hausgemacht</p>
            </div>
          </div>
          <nav className="ff-nav">
            {(() => {
              const base = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';
              const mitarbeiterUrl = base ? `${base}/mitarbeiter` : '/mitarbeiter';
              const panelUrl = base ? `${base}/panel` : '/panel';
              return <>
                <a href={mitarbeiterUrl}>Mitarbeiter Login</a>
                <a href={panelUrl}>Verwaltung</a>
              </>;
            })()}
          </nav>
        </header>


        <section className="ff-intro">
          <p>
            Willkommen bei Fusion Feast – Ihrem Treffpunkt für ehrliche Küche mit Charakter. Wir verbinden vertraute
            Hausmannskost mit leichten modernen Akzenten und setzen auf ausgewählte Zutaten, sorgfältige Zubereitung
            und einen Service, der aufmerksam ist ohne zu stören. Lehnen Sie sich zurück und genießen Sie.
          </p>
        </section>

        <section className="ff-menu">
          <div className="ff-menu-section">
            <h2>Essen</h2>
            <ul className="ff-menu-list">
              {ESSEN.map(item => (
                <li key={item.name} className="ff-menu-item">
                  <div className="ff-line">
                    <span className="ff-item-name">{item.name}</span>
                    <span className="ff-dots" />
                    <span className="ff-price">{item.price} $</span>
                  </div>
                  {item.desc && <div className="ff-desc">{item.desc}</div>}
                  {item.ing && <div className="ff-ingredients">Enthält (Auszug): {item.ing}</div>}
                </li>
              ))}
            </ul>
          </div>
          <div className="ff-menu-section">
            <h2>Trinken</h2>
            <ul className="ff-menu-list">
              {TRINKEN.map(item => (
                <li key={item.name} className="ff-menu-item">
                  <div className="ff-line">
                    <span className="ff-item-name">{item.name}</span>
                    <span className="ff-dots" />
                    <span className="ff-price">{item.price} $</span>
                  </div>
                  {item.ing && <div className="ff-ingredients">Hinweis: {item.ing}</div>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ff-features">
          <h3>Unser Selbstverständnis</h3>
          <div className="ff-feature-grid">
            <div className="ff-feature">Frisch & Saisonal</div>
            <div className="ff-feature">Sorgfältige Zubereitung</div>
            <div className="ff-feature">Transparente Qualität</div>
            <div className="ff-feature">Aufmerksamer Service</div>
          </div>
        </section>

  <footer className="ff-footer">© {new Date().getFullYear()} Fusion Feast – Alle Rechte vorbehalten</footer>
      </div>
    </div>
  );
}
